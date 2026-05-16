import {
  storageApproachEnum,
  uploadApproachEnum,
} from "./../../common/enums/multer.enum";
import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interfaces";
import { LogoutEnum } from "../../common/enums";
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../config/config";
import { ConflictException, NotFoundException } from "../../common/exceptions";
import {
  cloudinaryService,
  redisService,
  RedisService,
  TokenService,
} from "../../common/services";
import type {
  AssetStorage,
  StorageUploadManyParams,
} from "../../common/interfaces";
import { UserRepository } from "../../DB/repository";

export class UserService {
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  // =================================================
  private readonly userRepository: UserRepository;
  // =================================================
  // The thing I did here was call up cloudinary with the name s3 so I could follow the engineer's explanation and not get confused. And when I finish the project, God willing, I won't forget to edit it again 😂
  private readonly s3: AssetStorage;
  // ====================================
  // ===================================
  // ==================================

  constructor() {
    this.redis = redisService;
    this.tokenService = new TokenService();
    // =================================================
    this.userRepository = new UserRepository();
    // =================================================
    this.s3 = cloudinaryService;
  }

  async profileImage(
    {
      ContentType,
      Originalname,
    }: { ContentType?: string; Originalname: string },
    user: HydratedDocument<IUser>,
  ): Promise<{ user: IUser; uploadData: { url: string; key: string } }> {
    const currentUser = (await user
      .model("User")
      .findById(user._id)
      .lean()) as IUser | null;
    const oldPic = currentUser?.profilePicture;

    const uploadData = await this.s3.createPresignedUploadLink({
      path: `Users/${user._id.toString()}/profile`,
      ContentType,
      Originalname,
    });

    if (oldPic && oldPic !== uploadData.key) {
      await this.s3.deleteAsset({ Key: oldPic });
    }

    user.profilePicture = uploadData.key;
    await user.save();

    return { user: user.toJSON() as IUser, uploadData };
  }

  async profileCoverImages(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>,
  ) {
    const currentUser = (await user
      .model("User")
      .findById(user._id)
      .lean()) as IUser | null;
    const oldUrls = currentUser?.profileCoverPictures || [];

    const params: StorageUploadManyParams = {
      files,
      path: `Users/${user._id.toString()}/cover`,
      storageApproach: storageApproachEnum.DISK,
      uploadApproach: uploadApproachEnum.LARGE,
    };

    const urls = await this.s3.uploadAssets(params);

    user.profileCoverPictures = urls;
    await user.save();

    if (oldUrls.length > 0) {
      try {
        const keysToDelete = oldUrls.map((url) => ({ Key: url }));

        await this.s3.deleteAssets({
          keys: keysToDelete,
        });

        console.log(`--- Cleaned up ${oldUrls.length} old cover images ---`);
      } catch (error) {
        console.error("Cleanup of old covers failed:", error);
      }
    }

    return user.toJSON() as IUser;
  }

  async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user.toJSON();
  }

  async logout(
    { flag }: { flag: LogoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    let status = 200;

    switch (flag) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        const baseRevokeTokenKey = this.redis.baseRevokeTokenKey(sub);
        await this.redis.deleteKey(
          await this.redis.keys(`${baseRevokeTokenKey}::*`),
        );
        break;
      default:
        await this.tokenService.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + REFRESH_EXPIRES_IN,
        });
        status = 201;
        break;
    }
    return status;
  }

  async rotateToken(
    user: HydratedDocument<IUser>,
    { sub, jti, iat }: { sub: string; jti: string; iat: number },
    issuer: string,
  ) {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
      throw new ConflictException("current access token still valid");
    }

    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + REFRESH_EXPIRES_IN,
    });

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  async deleteProfile(user: HydratedDocument<IUser>) {
    const account = await this.userRepository.deleteOne({
      filter: { _id: user._id, force: true },
    });

    if (!account.deletedCount) {
      throw new NotFoundException("Invalid account");
    }

    try {
      await this.s3.deleteFolderByPrefix({
        prefix: `Users/${user._id.toString()}`,
      });
      console.log(`--- Assets for user ${user._id} deleted successfully ---`);
    } catch (error) {
      console.error("Failed to delete user assets from storage:", error);
    }

    return account;
  }
}

export default new UserService();

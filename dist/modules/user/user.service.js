"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const multer_enum_1 = require("./../../common/enums/multer.enum");
const enums_1 = require("../../common/enums");
const config_1 = require("../../config/config");
const exceptions_1 = require("../../common/exceptions");
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
class UserService {
    redis;
    tokenService;
    userRepository;
    s3;
    constructor() {
        this.redis = services_1.redisService;
        this.tokenService = new services_1.TokenService();
        this.userRepository = new repository_1.UserRepository();
        this.s3 = services_1.cloudinaryService;
    }
    async profileImage({ ContentType, Originalname, }, user) {
        const currentUser = (await user
            .model("User")
            .findById(user._id)
            .lean());
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
        return { user: user.toJSON(), uploadData };
    }
    async profileCoverImages(files, user) {
        const currentUser = (await user
            .model("User")
            .findById(user._id)
            .lean());
        const oldUrls = currentUser?.profileCoverPictures || [];
        const params = {
            files,
            path: `Users/${user._id.toString()}/cover`,
            storageApproach: multer_enum_1.storageApproachEnum.DISK,
            uploadApproach: multer_enum_1.uploadApproachEnum.LARGE,
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
            }
            catch (error) {
                console.error("Cleanup of old covers failed:", error);
            }
        }
        return user.toJSON();
    }
    async profile(user) {
        return user.toJSON();
    }
    async logout({ flag }, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case enums_1.LogoutEnum.ALL:
                user.changeCredentialsTime = new Date();
                await user.save();
                const baseRevokeTokenKey = this.redis.baseRevokeTokenKey(sub);
                await this.redis.deleteKey(await this.redis.keys(`${baseRevokeTokenKey}::*`));
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + config_1.REFRESH_EXPIRES_IN,
                });
                status = 201;
                break;
        }
        return status;
    }
    async rotateToken(user, { sub, jti, iat }, issuer) {
        if ((iat + config_1.ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
            throw new exceptions_1.ConflictException("current access token still valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + config_1.REFRESH_EXPIRES_IN,
        });
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async deleteProfile(user) {
        const account = await this.userRepository.deleteOne({
            filter: { _id: user._id, force: true },
        });
        if (!account.deletedCount) {
            throw new exceptions_1.NotFoundException("Invalid account");
        }
        try {
            await this.s3.deleteFolderByPrefix({
                prefix: `Users/${user._id.toString()}`,
            });
            console.log(`--- Assets for user ${user._id} deleted successfully ---`);
        }
        catch (error) {
            console.error("Failed to delete user assets from storage:", error);
        }
        return account;
    }
}
exports.UserService = UserService;
exports.default = new UserService();

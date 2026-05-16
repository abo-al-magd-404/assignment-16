import { CommentRepository } from "./../../DB/repository/comment.repository";
import { HydratedDocument, Types } from "mongoose";
import {
  CreateCommentBodyDto,
  CreateCommentParamsDto,
  CreateReplyOnCommentDto,
} from "./comment.dto";
import { AssetStorage, IComment, IPost, IUser } from "../../common/interfaces";
import {
  cloudinaryService,
  NotificationService,
  notificationService,
  redisService,
  RedisService,
} from "../../common/services";
import { PostRepository, UserRepository } from "../../DB/repository";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions";
import { toObjectId } from "../../common/utils/objectId";
import { getAvailability } from "../../common/utils/post";
import { NotificationModel } from "../../DB/models/notification.model";

export class CommentService {
  private readonly redis: RedisService;
  private readonly userRepository: UserRepository;
  private readonly postRepository: PostRepository;
  private readonly commentRepository: CommentRepository;
  private readonly notification: NotificationService;
  // The thing I did here was call up cloudinary with the name s3 so I could follow the engineer's explanation and not get confused. And when I finish the project, God willing, I won't forget to edit it again 😂
  private readonly s3: AssetStorage;
  // ====================================
  // ===================================
  // ==================================

  constructor() {
    this.redis = redisService;
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.commentRepository = new CommentRepository();
    this.notification = notificationService;
    // =================================================
    this.s3 = cloudinaryService;
    // =================================================
  }

  private async createNotification(data: {
    title: string;
    body: string;
    senderId: string;
    recipient: string;
  }) {
    return await NotificationModel.create(data);
  }

  async createComment(
    { postId }: CreateCommentParamsDto,
    { content, files = [], tags }: CreateCommentBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        $or: getAvailability(user),
      },
    });

    if (!post) {
      throw new NotFoundException("fail to find matching post");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];

    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(toObjectId(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) => {
          FCM_Tokens.push(token);
        });
      }
    }

    const folderId = post.folderId;
    let attachments: string[] = [];

    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const comment = await this.commentRepository.createOne({
      data: {
        content: content as string,
        attachments,

        tags: mentions,
        postId: post._id,

        createdBy: user._id,
      },
    });

    if (!comment) {
      if (attachments.length) {
        await this.s3.deleteAssets({
          keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("Fail to create a post");
    }

    if (FCM_Tokens.length) {
      const title = "Post Mention";
      const body = `${user.username} mentioned you in a comment`;

      // 1️⃣ Save notification in DB
      for (const tag of mentions) {
        await this.createNotification({
          title,
          body,
          senderId: user._id.toString(),
          recipient: tag.toString(),
        });
      }

      // 2️⃣ Send push notification
      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title,
          body: JSON.stringify({
            postId: post._id,
            comment: comment._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }

  async replyOnComment(
    { postId, commentId }: CreateReplyOnCommentDto,
    { content, files = [], tags }: CreateCommentBodyDto,
    user: HydratedDocument<IUser>,
  ): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: {
        _id: commentId,
        postId: postId,
      },
      options: {
        populate: [
          {
            path: "postId",
            match: {
              $or: getAvailability(user),
            },
          },
        ],
      },
    });

    if (!comment?.postId) {
      throw new NotFoundException("fail to find matching comment");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];

    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });

      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(toObjectId(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) => {
          FCM_Tokens.push(token);
        });
      }
    }

    const post = comment.postId as HydratedDocument<IPost>;
    const folderId = post.folderId;
    let attachments: string[] = [];

    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }

    const reply = await this.commentRepository.createOne({
      data: {
        content: content as string,
        attachments,

        postId: post._id,
        commentId: comment._id,

        createdBy: user._id,
      },
    });

    if (!reply) {
      if (attachments.length) {
        await this.s3.deleteAssets({
          keys: attachments.map((ele) => {
            return { Key: ele };
          }),
        });
      }
      throw new BadRequestException("Fail to create a post");
    }

    if (FCM_Tokens.length) {
      const title = "Post Mention";
      const body = `${user.username} mentioned you in a reply`;

      // 1️⃣ Save notifications in DB
      for (const tag of mentions) {
        await this.createNotification({
          title,
          body,
          senderId: user._id.toString(),
          recipient: tag.toString(),
        });
      }

      // 2️⃣ Send push notification
      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title,
          body: JSON.stringify({
            postId: post._id,
            replyId: reply._id,
          }),
        },
      });
    }

    return reply.toJSON();
  }
}

export const commentService = new CommentService();

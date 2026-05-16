"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const comment_repository_1 = require("./../../DB/repository/comment.repository");
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
const exceptions_1 = require("../../common/exceptions");
const objectId_1 = require("../../common/utils/objectId");
const post_1 = require("../../common/utils/post");
const notification_model_1 = require("../../DB/models/notification.model");
class CommentService {
    redis;
    userRepository;
    postRepository;
    commentRepository;
    notification;
    s3;
    constructor() {
        this.redis = services_1.redisService;
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.commentRepository = new comment_repository_1.CommentRepository();
        this.notification = services_1.notificationService;
        this.s3 = services_1.cloudinaryService;
    }
    async createNotification(data) {
        return await notification_model_1.NotificationModel.create(data);
    }
    async createComment({ postId }, { content, files = [], tags }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: (0, post_1.getAvailability)(user),
            },
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("fail to find matching post");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccount.length != tags.length) {
                throw new exceptions_1.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push((0, objectId_1.toObjectId)(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => {
                    FCM_Tokens.push(token);
                });
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const comment = await this.commentRepository.createOne({
            data: {
                content: content,
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
            throw new exceptions_1.BadRequestException("Fail to create a post");
        }
        if (FCM_Tokens.length) {
            const title = "Post Mention";
            const body = `${user.username} mentioned you in a comment`;
            for (const tag of mentions) {
                await this.createNotification({
                    title,
                    body,
                    senderId: user._id.toString(),
                    recipient: tag.toString(),
                });
            }
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
    async replyOnComment({ postId, commentId }, { content, files = [], tags }, user) {
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
                            $or: (0, post_1.getAvailability)(user),
                        },
                    },
                ],
            },
        });
        if (!comment?.postId) {
            throw new exceptions_1.NotFoundException("fail to find matching comment");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccount.length != tags.length) {
                throw new exceptions_1.NotFoundException("Fail to find some or all mentioned accounts");
            }
            for (const tag of tags) {
                mentions.push((0, objectId_1.toObjectId)(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => {
                    FCM_Tokens.push(token);
                });
            }
        }
        const post = comment.postId;
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const reply = await this.commentRepository.createOne({
            data: {
                content: content,
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
            throw new exceptions_1.BadRequestException("Fail to create a post");
        }
        if (FCM_Tokens.length) {
            const title = "Post Mention";
            const body = `${user.username} mentioned you in a reply`;
            for (const tag of mentions) {
                await this.createNotification({
                    title,
                    body,
                    senderId: user._id.toString(),
                    recipient: tag.toString(),
                });
            }
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
exports.CommentService = CommentService;
exports.commentService = new CommentService();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const services_1 = require("../../common/services");
const repository_1 = require("../../DB/repository");
const exceptions_1 = require("../../common/exceptions");
const node_crypto_1 = require("node:crypto");
const post_1 = require("../../common/utils/post");
const objectId_1 = require("../../common/utils/objectId");
const notification_model_1 = require("../../DB/models/notification.model");
class PostService {
    populate = [
        { path: "comments" },
        { path: "createdBy" },
        { path: "tags" },
        { path: "updatedBy" },
        {
            path: "reactions.user",
        },
        {
            path: "comments",
            populate: [
                {
                    path: "reply",
                    populate: [{ path: "reply" }],
                },
            ],
        },
    ];
    redis;
    userRepository;
    postRepository;
    notification;
    s3;
    constructor() {
        this.redis = services_1.redisService;
        this.userRepository = new repository_1.UserRepository();
        this.postRepository = new repository_1.PostRepository();
        this.notification = services_1.notificationService;
        this.s3 = services_1.cloudinaryService;
    }
    async createNotification(data) {
        return await notification_model_1.NotificationModel.create(data);
    }
    async createPost({ availability, content, files = [], tags }, user) {
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
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const post = await this.postRepository.createOne({
            data: {
                content: content,
                attachments,
                tags: mentions,
                folderId,
                availability,
                createdBy: user._id,
            },
        });
        if (!post) {
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
            const body = `${user.username} mentioned you in a post`;
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
                    }),
                },
            });
        }
        return post.toJSON();
    }
    async updatePost({ postId }, { availability, content, files = [], removeFiles, tags = [], removeTags, }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
        });
        if (!post) {
            throw new exceptions_1.NotFoundException("Fail to find matching post");
        }
        if (!post.content &&
            !content &&
            !files?.length &&
            post.attachments?.length == removeFiles?.length) {
            throw new exceptions_1.BadRequestException("we can not leave empty post");
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
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
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
        const updatedPost = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                createdBy: user._id,
            },
            update: [
                {
                    $set: {
                        content: content || post.content,
                        availability: Number(availability || post.availability),
                        updatedBy: user._id,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: ["$attachments", removeFiles],
                                },
                                attachments,
                            ],
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        removeTags?.map((ele) => {
                                            return (0, objectId_1.toObjectId)(ele);
                                        }),
                                    ],
                                },
                                mentions,
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatedPost) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    keys: attachments.map((ele) => {
                        return { Key: ele };
                    }),
                });
            }
            throw new exceptions_1.BadRequestException("Fail to create a post");
        }
        if (removeFiles?.length) {
            await this.s3.deleteAssets({
                keys: removeFiles.map((ele) => {
                    return { Key: ele };
                }),
            });
        }
        if (FCM_Tokens.length) {
            const title = "Post Mention Updated";
            const body = `${user.username} mentioned you in an updated post`;
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
                    }),
                },
            });
        }
        return updatedPost.toJSON();
    }
    async postList({ page, search, size }, user) {
        const posts = await this.postRepository.paginate({
            filter: {
                $or: (0, post_1.getAvailability)(user),
                ...(search?.length
                    ? { content: { $regex: search, $options: "i" } }
                    : {}),
            },
            page,
            size,
            options: {
                populate: this.populate,
            },
        });
        return posts;
    }
    async reactPost({ postId }, { react }, user) {
        if (react === undefined || react === null) {
            const post = await this.postRepository.findOneAndUpdate({
                filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
                update: { $pull: { reactions: { user: user._id } } },
            });
            if (!post)
                throw new exceptions_1.NotFoundException("Fail to find matching post");
            return post.toJSON();
        }
        await this.postRepository.updateOne({
            filter: { _id: postId },
            update: { $pull: { reactions: { user: user._id } } },
        });
        const post = await this.postRepository.findOneAndUpdate({
            filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
            update: {
                $addToSet: { reactions: { user: user._id, type: react } },
            },
            populate: this.populate,
        });
        if (!post)
            throw new exceptions_1.NotFoundException("Fail to find matching post");
        return post.toJSON();
    }
}
exports.PostService = PostService;
exports.postService = new PostService();

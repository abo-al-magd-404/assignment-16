"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const comment_model_1 = require("./comment.model");
const postSchema = new mongoose_1.Schema({
    folderId: { type: String, required: true },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    availability: {
        type: Number,
        enum: enums_1.availabilityEnum,
        default: enums_1.availabilityEnum.PUBLIC,
    },
    reactions: [
        {
            user: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
            type: { type: Number, required: true },
            _id: false,
        },
    ],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_POSTS",
});
postSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "postId",
});
postSchema.pre("save", function () { });
postSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
    let update = this.getUpdate();
    const query = this.getQuery();
    if (!update.$set)
        update.$set = {};
    if (update.deletedAt) {
        update.$set.deletedAt = update.deletedAt;
        delete update.deletedAt;
        update.$unset = {
            ...(update.$unset || {}),
            restoredAt: 1,
        };
        const post = await this.model.findOne(query);
        if (post) {
            await comment_model_1.CommentModel.updateMany({ postId: post._id }, { deletedAt: new Date() });
        }
    }
    if (update.restoredAt) {
        update.$set.restoredAt = update.restoredAt;
        delete update.restoredAt;
        update.$unset = {
            ...(update.$unset || {}),
            deletedAt: 1,
        };
        this.setQuery({
            ...query,
            deletedAt: { $exists: true },
        });
        const post = await this.model.findOne({
            ...query,
            paranoid: false,
        });
        if (post) {
            await comment_model_1.CommentModel.updateMany({ postId: post._id, paranoid: false }, { restoredAt: new Date() });
        }
    }
    this.setUpdate(update);
    if (query.paranoid === false) {
        delete query.paranoid;
        this.setQuery(query);
    }
    else {
        this.setQuery({
            deletedAt: { $exists: false },
            ...query,
        });
    }
});
postSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    if (query.force === true) {
        delete query.force;
        const post = await this.model.findOne(query);
        if (post) {
            await comment_model_1.CommentModel.deleteMany({
                postId: post._id,
                force: true,
            });
        }
        this.setQuery(query);
        return;
    }
    this.setQuery({
        deletedAt: { $exists: true },
        ...query,
    });
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);

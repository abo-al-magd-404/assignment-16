"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    reactions: [
        {
            user: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
            type: { type: Number, required: true },
            _id: false,
        },
    ],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    postId: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Types.ObjectId, ref: "Comment" },
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
    collection: "SOCIAL_APP_COMMENTS",
});
commentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
    justOn: true,
});
commentSchema.pre("save", function () { });
commentSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
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
        const comment = await this.model.findOne(query);
        if (comment) {
            await exports.CommentModel.updateMany({ commentId: comment._id }, { deletedAt: new Date() });
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
        const comment = await this.model.findOne({
            ...query,
            paranoid: false,
        });
        if (comment) {
            await exports.CommentModel.updateMany({ commentId: comment._id, paranoid: false }, { restoredAt: new Date() });
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
commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    if (query.force === true) {
        delete query.force;
        const comment = await this.model.findOne(query);
        if (comment) {
            await exports.CommentModel.deleteMany({
                commentId: comment._id,
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
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchema);

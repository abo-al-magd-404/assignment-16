"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
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
postSchema.pre(["find", "findOne", "countDocuments"], function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        delete query.paranoid;
        this.setQuery(query);
    }
    else {
        this.setQuery({
            ...query,
            deletedAt: { $exists: false },
        });
    }
});
postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    let update = this.getUpdate();
    if (!update.$set) {
        update.$set = {};
    }
    if (update.deletedAt) {
        update.$set.deletedAt = update.deletedAt;
        delete update.deletedAt;
        update.$unset = { ...(update.$unset || {}), restoredAt: 1 };
    }
    if (update.restoredAt) {
        update.$set.restoredAt = update.restoredAt;
        delete update.restoredAt;
        update.$unset = { ...(update.$unset || {}), deletedAt: 1 };
        this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
        });
    }
    this.setUpdate(update);
    const query = this.getQuery();
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
postSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    if (query.force === true) {
        delete query.force;
        this.setQuery(query);
        return;
    }
    this.setQuery({
        deletedAt: { $exists: true },
        ...query,
    });
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);

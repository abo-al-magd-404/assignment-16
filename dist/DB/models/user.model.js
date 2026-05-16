"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../../common/enums");
const security_1 = require("../../common/utils/security");
const mongoose_2 = require("mongoose");
const post_model_1 = require("./post.model");
const comment_model_1 = require("./comment.model");
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return this.provider == enums_1.ProviderEnum.SYSTEM;
        },
    },
    phone: { type: String },
    profilePicture: { type: String },
    profileCoverPictures: { type: [String] },
    friends: [{ type: mongoose_2.Types.ObjectId, ref: "User" }],
    gender: { type: Number, enum: enums_1.GenderEnum, default: enums_1.GenderEnum.MALE },
    role: { type: Number, enum: enums_1.RoleEnum, default: enums_1.RoleEnum.USER },
    provider: {
        type: Number,
        enum: enums_1.ProviderEnum,
        default: enums_1.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_USERS",
});
userSchema
    .virtual("username")
    .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
    this.slug = value.replaceAll(/\s+/g, "-");
})
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
});
userSchema.pre("save", async function () {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, security_1.generateHash)({ plaintext: this.password });
    }
    if (this.phone && this.isModified("phone")) {
        this.phone = await (0, security_1.generateEncryption)(this.phone);
    }
});
userSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
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
        const user = await this.model.findOne(query);
        if (user) {
            await post_model_1.PostModel.updateMany({ createdBy: user._id }, { deletedAt: new Date() });
            await comment_model_1.CommentModel.updateMany({ createdBy: user._id }, { deletedAt: new Date() });
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
        const user = await this.model.findOne({
            ...query,
            paranoid: false,
        });
        if (user) {
            await post_model_1.PostModel.updateMany({ createdBy: user._id, paranoid: false }, { restoredAt: new Date() });
            await comment_model_1.CommentModel.updateMany({ createdBy: user._id, paranoid: false }, { restoredAt: new Date() });
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
userSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
    const query = this.getQuery();
    if (query.force === true) {
        delete query.force;
        const user = await this.model.findOne(query);
        if (user) {
            await post_model_1.PostModel.deleteMany({
                createdBy: user._id,
                force: true,
            });
            await comment_model_1.CommentModel.deleteMany({
                createdBy: user._id,
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
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);

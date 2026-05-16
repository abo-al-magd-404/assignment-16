import { HydratedDocument, model, models, Schema } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums";
import { IUser } from "../../common/interfaces";
import { generateEncryption, generateHash } from "../../common/utils/security";
import { Types } from "mongoose";
import { PostModel } from "./post.model";
import { CommentModel } from "./comment.model";

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    slug: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this) {
        return this.provider == ProviderEnum.SYSTEM;
      },
    },

    phone: { type: String },
    profilePicture: { type: String },
    profileCoverPictures: { type: [String] },

    friends: [{ type: Types.ObjectId, ref: "User" }],

    gender: { type: Number, enum: GenderEnum, default: GenderEnum.MALE },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.USER },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },

    changeCredentialsTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },

    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_USERS",
  },
);

userSchema
  .virtual("username")
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName as string;
    this.lastName = lastName as string;
    this.slug = value.replaceAll(/\s+/g, "-");
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

// ===== MIDDLEWARE =====

// ======================
// PRE SAVE
// ======================
userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
    this.wasNew = this.isNew;

    if (this.isModified("password")) {
      this.password = await generateHash({ plaintext: this.password });
    }

    if (this.phone && this.isModified("phone")) {
      this.phone = await generateEncryption(this.phone);
    }
  },
);

// ======================
// PRE UPDATE (SOFT DELETE + RESTORE + PARANOID + CASCADE)
// ======================
userSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
  let update = this.getUpdate() as any;
  const query = this.getQuery() as any;

  if (!update.$set) update.$set = {};

  // ======================
  // SOFT DELETE
  // ======================
  if (update.deletedAt) {
    update.$set.deletedAt = update.deletedAt;
    delete update.deletedAt;

    update.$unset = {
      ...(update.$unset || {}),
      restoredAt: 1,
    };

    const user = await this.model.findOne(query);

    if (user) {
      await PostModel.updateMany(
        { createdBy: user._id },
        { deletedAt: new Date() },
      );

      await CommentModel.updateMany(
        { createdBy: user._id },
        { deletedAt: new Date() },
      );
    }
  }

  // ======================
  // RESTORE
  // ======================
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
      await PostModel.updateMany(
        { createdBy: user._id, paranoid: false } as any,
        { restoredAt: new Date() },
      );

      await CommentModel.updateMany(
        { createdBy: user._id, paranoid: false } as any,
        { restoredAt: new Date() },
      );
    }
  }

  this.setUpdate(update);

  // ======================
  // PARANOID FILTER
  // ======================
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery(query);
  } else {
    this.setQuery({
      deletedAt: { $exists: false },
      ...query,
    });
  }
});

// ======================
// PRE DELETE (HARD DELETE + CASCADE)
// ======================
userSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery() as any;

  // ======================
  // FORCE HARD DELETE
  // ======================
  if (query.force === true) {
    delete query.force;

    const user = await this.model.findOne(query);

    if (user) {
      await PostModel.deleteMany({
        createdBy: user._id,
        force: true,
      } as any);

      await CommentModel.deleteMany({
        createdBy: user._id,
        force: true,
      } as any);
    }

    this.setQuery(query);
    return;
  }

  // ======================
  // DEFAULT: ONLY HARD DELETE SOFT-DELETED USERS
  // ======================
  this.setQuery({
    deletedAt: { $exists: true },
    ...query,
  });
});

export const UserModel = models.User || model<IUser>("User", userSchema);

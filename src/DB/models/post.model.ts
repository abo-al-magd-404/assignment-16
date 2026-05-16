import { model, models, Schema, Types } from "mongoose";
import { availabilityEnum } from "../../common/enums";
import { IPost } from "../../common/interfaces";
import { CommentModel } from "./comment.model";

const postSchema = new Schema<IPost>(
  {
    folderId: { type: String, required: true },

    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },

    attachments: { type: [String] },

    availability: {
      type: Number,
      enum: availabilityEnum,
      default: availabilityEnum.PUBLIC,
    },

    reactions: [
      {
        user: { type: Types.ObjectId, ref: "User", required: true },
        type: { type: Number, required: true },
        _id: false,
      },
    ],

    tags: [{ type: Types.ObjectId, ref: "User" }],

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_POSTS",
  },
);

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
});

// ===== MIDDLEWARE =====

// ======================
// PRE SAVE
// ======================
postSchema.pre("save", function () {});

// ======================
// PRE UPDATE (SOFT DELETE + RESTORE + PARANOID + CASCADE)
// ======================
postSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
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

    const post = await this.model.findOne(query);

    if (post) {
      // cascade soft delete comments
      await CommentModel.updateMany(
        { postId: post._id },
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

    const post = await this.model.findOne({
      ...query,
      paranoid: false,
    });

    if (post) {
      await CommentModel.updateMany(
        { postId: post._id, paranoid: false } as any,
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
postSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery() as any;

  // ======================
  // FORCE HARD DELETE
  // ======================
  if (query.force === true) {
    delete query.force;

    const post = await this.model.findOne(query);

    if (post) {
      // hard delete comments
      await CommentModel.deleteMany({
        postId: post._id,
        force: true,
      } as any);
    }

    this.setQuery(query);
    return;
  }

  // ======================
  // DEFAULT: ONLY HARD DELETE SOFT-DELETED POSTS
  // ======================
  this.setQuery({
    deletedAt: { $exists: true },
    ...query,
  });
});

export const PostModel = models.Post || model<IPost>("Post", postSchema);

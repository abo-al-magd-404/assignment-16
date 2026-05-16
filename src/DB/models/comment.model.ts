import { model, models, Schema, Types } from "mongoose";
import { IComment } from "../../common/interfaces";

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },

    attachments: { type: [String] },

    reactions: [
      {
        user: { type: Types.ObjectId, ref: "User", required: true },
        type: { type: Number, required: true },
        _id: false,
      },
    ],

    tags: [{ type: Types.ObjectId, ref: "User" }],

    postId: { type: Types.ObjectId, ref: "Post", required: true },
    commentId: { type: Types.ObjectId, ref: "Comment" },

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
    collection: "SOCIAL_APP_COMMENTS",
  },
);

// comment._id => reply.commentId
commentSchema.virtual("reply", {
  localField: "_id",
  foreignField: "commentId",
  ref: "Comment",
  justOn: true,
});

// ===== MIDDLEWARE =====

// ======================
// PRE SAVE (future use)
// ======================
commentSchema.pre("save", function () {});

// ======================
// PRE UPDATE (SOFT DELETE + RESTORE + PARANOID + CASCADE)
// ======================
commentSchema.pre(["updateOne", "findOneAndUpdate"], async function () {
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

    const comment = await this.model.findOne(query);

    if (comment) {
      // ======================
      // CASCADE: replies
      // ======================
      await CommentModel.updateMany(
        { commentId: comment._id },
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

    const comment = await this.model.findOne({
      ...query,
      paranoid: false,
    });

    if (comment) {
      // restore replies
      await CommentModel.updateMany(
        { commentId: comment._id, paranoid: false } as any,
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
commentSchema.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery() as any;

  // ======================
  // FORCE HARD DELETE
  // ======================
  if (query.force === true) {
    delete query.force;

    const comment = await this.model.findOne(query);

    if (comment) {
      // ======================
      // CASCADE HARD DELETE (replies)
      // ======================
      await CommentModel.deleteMany({
        commentId: comment._id,
        force: true,
      } as any);
    }

    this.setQuery(query);
    return;
  }

  // ======================
  // DEFAULT: ONLY HARD DELETE SOFT-DELETED COMMENTS
  // ======================
  this.setQuery({
    deletedAt: { $exists: true },
    ...query,
  });
});

export const CommentModel =
  models.Comment || model<IComment>("Comment", commentSchema);

import { model, models, Schema, Types } from "mongoose";

export interface INotification {
  title: string;
  body: string;
  senderId: Types.ObjectId;
  recipient: Types.ObjectId;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const NotificationModel =
  models.Notification ||
  model<INotification>("Notification", notificationSchema);

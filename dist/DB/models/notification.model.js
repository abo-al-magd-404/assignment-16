"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.NotificationModel = mongoose_1.models.Notification ||
    (0, mongoose_1.model)("Notification", notificationSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
class NotificationService {
    client;
    constructor() {
        var serviceAccount = JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.resolve)("./src/config/social-media-project-3b1ad-firebase-adminsdk-fbsvc-3de611428c.json")));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    async sendNotification({ token, data, }) {
        const message = {
            token,
            data,
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data, }) {
        await Promise.allSettled(tokens.map((token) => {
            return this.sendNotification({ token, data });
        }));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();

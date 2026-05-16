"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileGQL = void 0;
const zod_1 = require("zod");
exports.profileGQL = zod_1.z.strictObject({
    search: zod_1.z.string().min(2).optional(),
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectId = void 0;
const mongoose_1 = require("mongoose");
const toObjectId = (id) => {
    return mongoose_1.Types.ObjectId.createFromHexString(id);
};
exports.toObjectId = toObjectId;

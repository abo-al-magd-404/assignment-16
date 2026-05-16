"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const models_1 = require("../models");
const base_repository_1 = require("./base.repository");
class UserRepository extends base_repository_1.DatabaseRepository {
    constructor() {
        super(models_1.UserModel);
    }
}
exports.UserRepository = UserRepository;

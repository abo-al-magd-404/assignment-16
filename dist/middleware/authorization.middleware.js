"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GQLAuthorization = exports.authorization = void 0;
const exceptions_1 = require("../common/exceptions");
const authorization = (accessRoles) => {
    return (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new exceptions_1.ForbiddenException("not authorized account");
        }
        return next();
    };
};
exports.authorization = authorization;
const GQLAuthorization = async (accessRoles, user) => {
    if (!accessRoles.includes(user.role)) {
        throw (0, exceptions_1.MapGraphQLError)(new exceptions_1.ForbiddenException("Not authorized account"));
    }
    return true;
};
exports.GQLAuthorization = GQLAuthorization;

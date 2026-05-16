"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postResolver = exports.PostResolver = void 0;
const post_service_1 = require("../post.service");
const middleware_1 = require("../../../middleware");
const validation_1 = require("../../../common/validation");
const post_validation_1 = require("../post.validation");
class PostResolver {
    postService;
    constructor() {
        this.postService = post_service_1.postService;
    }
    postList = async (parent, args, { user }) => {
        await (0, middleware_1.GQLValidation)(validation_1.paginationValidationSchema.query, args);
        const data = await this.postService.postList(args, user);
        return { message: "Done", data };
    };
    reactPost = async (parent, { postId, react }, { user }) => {
        await (0, middleware_1.GQLValidation)(post_validation_1.reactPostGQL, { postId, react });
        const data = await this.postService.reactPost({ postId }, { react }, user);
        return { message: "Done", data };
    };
}
exports.PostResolver = PostResolver;
exports.postResolver = new PostResolver();

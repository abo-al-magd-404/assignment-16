"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyOnComment = exports.createComment = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createComment = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id,
    }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z
            .array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image))
            .optional(),
        tags: zod_1.z.array(validation_1.generalValidationFields.id).optional(),
    })
        .superRefine((args, ctx) => {
        if (!args.files?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Content Is Required",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated Tags",
                });
            }
        }
    }),
};
exports.replyOnComment = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id,
        commentId: validation_1.generalValidationFields.id,
    }),
    body: exports.createComment.body,
};

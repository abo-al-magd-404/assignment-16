"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactPost = exports.updatePost = exports.createPost = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../common/enums");
const mongoose_1 = require("mongoose");
const validation_1 = require("../../common/validation");
const multer_1 = require("../../common/utils/multer");
exports.createPost = {
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z
            .array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image))
            .optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        availability: zod_1.z.coerce.number().default(enums_1.availabilityEnum.PUBLIC),
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
            for (const tag of args.tags) {
                if (!mongoose_1.Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tagged ObjectId >>> ${tag}`,
                    });
                }
            }
        }
    }),
};
exports.updatePost = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id,
    }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z
            .array(validation_1.generalValidationFields.file(multer_1.fileFieldValidation.image))
            .optional(),
        removeFiles: zod_1.z.array(zod_1.z.string()).optional(),
        tags: zod_1.z.array(validation_1.generalValidationFields.id).optional(),
        removeTags: zod_1.z.array(zod_1.z.string()).optional(),
        availability: zod_1.z.coerce.number().optional(),
    })
        .superRefine((args, ctx) => {
        if (!Object.values(args)?.length) {
            ctx.addIssue({
                code: "custom",
                message: "Insert data to update",
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
exports.reactPost = {
    params: zod_1.z.strictObject({
        postId: validation_1.generalValidationFields.id,
    }),
    query: zod_1.z.strictObject({
        react: zod_1.z.coerce
            .number()
            .min(0)
            .max(Object.values(enums_1.ReactionTypeEnum).length / 2 - 1)
            .optional(),
    }),
};

import { z } from "zod";
import { generalValidationFields } from "../../common/validation";
import { fileFieldValidation } from "../../common/utils/multer";

export const createComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z
        .array(generalValidationFields.file(fileFieldValidation.image))
        .optional(),
      tags: z.array(generalValidationFields.id).optional(),
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

export const replyOnComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
    commentId: generalValidationFields.id,
  }),
  body: createComment.body,
};

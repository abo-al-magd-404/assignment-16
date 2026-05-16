import { z } from "zod";
import { availabilityEnum, ReactionTypeEnum } from "../../common/enums";
import { Types } from "mongoose";
import { generalValidationFields } from "../../common/validation";
import { fileFieldValidation } from "../../common/utils/multer";

export const createPost = {
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z
        .array(generalValidationFields.file(fileFieldValidation.image))
        .optional(),
      tags: z.array(z.string()).optional(),
      availability: z.coerce.number().default(availabilityEnum.PUBLIC),
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
          if (!Types.ObjectId.isValid(tag)) {
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

export const updatePost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z
        .array(generalValidationFields.file(fileFieldValidation.image))
        .optional(),
      removeFiles: z.array(z.string()).optional(),
      tags: z.array(generalValidationFields.id).optional(),
      removeTags: z.array(z.string()).optional(),
      availability: z.coerce.number().optional(),
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

export const reactPost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  query: z.strictObject({
    react: z.coerce
      .number()
      .min(0)
      .max(Object.values(ReactionTypeEnum).length / 2 - 1)
      .optional(),
  }),
};

export const reactPostGQL = z.strictObject({
  postId: generalValidationFields.id,
  react: z.coerce
    .number()
    .min(0)
    .max(Object.values(ReactionTypeEnum).length / 2 - 1)
    .optional(),
});

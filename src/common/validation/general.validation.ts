import { Types } from "mongoose";
import { z } from "zod";

export const generalValidationFields = {
  id: z.string().refine((value) => {
    return (Types.ObjectId.isValid(value), "Invalid objectId");
  }),
  email: z.email(),
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w).{8,16}$/, {
      error: "weak password",
    }),
  phone: z
    .string({ error: "phone is required" })
    .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
  otp: z.string({ error: "otp is required" }).regex(/^\d{6}$/),
  username: z
    .string({ error: "username is mandatory" })
    .min(2, { error: "min is 2 char" })
    .max(25, { error: "max is 25 char" }),
  confirmPassword: z.string(),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype),
        buffer: z.any().optional(),
        path: z.any().optional(),
        size: z.number(),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            path: ["buffer"],
            message: "buffer is required",
          });
        }
      });
  },
};

export const paginationValidationSchema = {
  query: z.strictObject({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};

export type PaginateDto = z.infer<typeof paginationValidationSchema.query>;

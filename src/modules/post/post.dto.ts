import { z } from "zod";
import {
  createPost,
  reactPost,
  reactPostGQL,
  updatePost,
} from "./post.validation";

export type CreatePostBodyDto = z.infer<typeof createPost.body>;

export type ReactPostQueryDto = z.infer<typeof reactPost.query>;
export type ReactPostParamsDto = z.infer<typeof reactPost.params>;
export type ReactPostArgsDto = z.infer<typeof reactPostGQL>;

export type UpdatePostBodyDto = z.infer<typeof updatePost.body>;
export type UpdatePostParamsDto = z.infer<typeof updatePost.params>;

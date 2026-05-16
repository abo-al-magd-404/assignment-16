import { z } from "zod";
import { createComment, replyOnComment } from "./comment.validation";

export type CreateCommentBodyDto = z.infer<typeof createComment.body>;
export type CreateCommentParamsDto = z.infer<typeof createComment.params>;

export type CreateReplyOnCommentDto = z.infer<typeof replyOnComment.params>;

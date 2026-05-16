import { successResponse } from "../../common/response";
import {
  cloudFileUpload,
  fileFieldValidation,
} from "../../common/utils/multer";
import { authentication, validation } from "../../middleware";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import * as validators from "./comment.validation";
import { commentService } from "./comment.service";
import { CreateCommentParamsDto, CreateReplyOnCommentDto } from "./comment.dto";
import { IComment } from "../../common/interfaces";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.createComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.createComment(
      req.params as CreateCommentParamsDto,
      {
        ...req.body,
        files: req.files as Express.Multer.File[],
      },
      req.user,
    );
    return successResponse<IComment>({ res, status: 201, data });
  },
);

router.post(
  "/:commentId/reply",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.replyOnComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.replyOnComment(
      req.params as CreateReplyOnCommentDto,
      {
        ...req.body,
        files: req.files as Express.Multer.File[],
      },
      req.user,
    );
    return successResponse<IComment>({ res, status: 201, data });
  },
);

export default router;

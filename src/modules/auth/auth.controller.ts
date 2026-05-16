import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import * as validators from "./auth.validation";
import { validation } from "../../middleware";
import { ILoginResponse } from "./auth.entity";
const router = Router();

router.post(
  "/login",
  validation(validators.login),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await authService.login(
      req.body,
      `${req.protocol}://${req.host}`,
    );
    return successResponse<ILoginResponse>({
      res,
      data,
    });
  },
);

router.post(
  "/signup",
  validation(validators.signup),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await authService.signup(req.body);
    return successResponse<any>({ res, status: 201, data });
  },
);

router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req: Request, res: Response, next: NextFunction) => {
    await authService.confirmEmail(req.body);
    return successResponse({ res });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validators.resendConfirmEmail),
  async (req: Request, res: Response, next: NextFunction) => {
    await authService.resendConfirmEmail(req.body);
    return successResponse({ res });
  },
);

router.post(
  "/signup/gmail",
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    const { status, credentials } = await authService.signupWithGmail(
      req.body.idToken,
      `${req.protocol}://${req.host}`,
    );

    return successResponse({ res, status, data: { credentials } });
  },
);

router.post(
  "/login/gmail",
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await authService.loginWithGmail(
      req.body.idToken,
      `${req.protocol}://${req.host}`,
    );
    return successResponse({ res, data });
  },
);

router.post(
  "/forget-password",
  validation(validators.forgetPassword),
  async (req: Request, res: Response, next: NextFunction) => {
    await authService.forgetPassword(req.body);

    return successResponse({
      res,
      message: "Reset password OTP sent successfully",
    });
  },
);

router.post(
  "/reset-password",
  validation(validators.resetPassword),
  async (req: Request, res: Response, next: NextFunction) => {
    await authService.resetPassword(req.body);

    return successResponse({
      res,
      message: "Password reset successfully",
    });
  },
);

export default router;

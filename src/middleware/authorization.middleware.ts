import { NextFunction, Request, Response } from "express";
import { ForbiddenException, MapGraphQLError } from "../common/exceptions";
import { RoleEnum } from "../common/enums";
import { IUser } from "../common/interfaces";
import { HydratedDocument } from "mongoose";

export const authorization = (accessRoles: RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException("not authorized account");
    }

    return next();
  };
};

export const GQLAuthorization = async (
  accessRoles: RoleEnum[],
  user: HydratedDocument<IUser>,
): Promise<boolean> => {
  if (!accessRoles.includes(user.role)) {
    throw MapGraphQLError(new ForbiddenException("Not authorized account"));
  }

  return true;
};

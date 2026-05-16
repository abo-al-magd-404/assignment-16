import type { NextFunction, Request, Response } from "express";
import { BadRequestException, MapGraphQLError } from "../common/exceptions";
import { ZodError, ZodType } from "zod";

type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;
type IssuesType = Array<{
  key: KeyReqType;
  issues: Array<{
    message: string;
    path: Array<symbol | number | string | undefined | null>;
  }>;
}>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const issues: IssuesType = [];

    for (const key of Object.keys(schema) as KeyReqType[]) {
      if (!schema[key]) continue;

      if (req.file) {
        req.body.file = req.file;
      }

      if (req.files) {
        console.log(req.files);
        req.body.files = req.files;
      }

      const validationResult = schema[key].safeParse(req[key]);

      if (!validationResult.success) {
        const error = validationResult.error as ZodError;
        issues.push({
          key,
          issues: error.issues.map((issue) => {
            return { path: issue.path, message: issue.message };
          }),
        });
      }
    }

    if (issues.length) {
      throw new BadRequestException("Validation Error", { issues });
    }

    next();
  };
};

export const GQLValidation = async <T>(
  schema: ZodType,
  args: T,
): Promise<boolean> => {
  const validationResult = schema.safeParse(args);

  if (!validationResult.success) {
    throw MapGraphQLError(
      new BadRequestException("Validation Error", {
        issues: validationResult.error.issues.map((issue) => {
          return { path: issue.path, message: issue.message };
        }),
      }),
    );
  }

  return true;
};

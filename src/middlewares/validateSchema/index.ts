/* eslint-disable max-len */
import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { ZodValidationException } from "../errorHandler/errors/HttpExceptions";

export const validateSchema =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    const safeParsedResult = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    if (!safeParsedResult.success) {
      throw new ZodValidationException(safeParsedResult.error);
    }
    const parsedData = safeParsedResult.data;
    req["body"] = parsedData.body;
    req["query"] = parsedData.query;
    req["params"] = parsedData.params;
    return next();
  };

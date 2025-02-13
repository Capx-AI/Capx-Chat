/* eslint-disable max-len */
import { NextFunction, Request, Response } from "express";
import HttpExceptionError, {
  GameEndedErrorException,
  ZodValidationException
} from "./errors/HttpExceptions";
import { createSupabaseClient } from "../../init/supabase";

export async function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`ERROR - ${req.path} `);
  console.error(err);

  if (!(err instanceof GameEndedErrorException))
    await registerError(
      req.user.id ? req.user.id : "Unknown User",
      req.path.substring(1).replace("/", "_"),
      req.query,
      req.headers.authorization ? req.headers.authorization : "Missing Token.",
      err
    );

  // In your errorHandler middleware
  if (err instanceof GameEndedErrorException) {
    const { message, details } = err.serializeErrors();
    return res.status(err.errorCode).send({
      result: {
        success: false,
        message,
        ...details
      }
    });
  }

  if (err instanceof ZodValidationException) {
    const { message, errorDetails } = err.serializeErrors();
    return res.status(err.errorCode).send({
      result: { success: false, message: message, error_detail: errorDetails }
    });
  }

  if (err instanceof HttpExceptionError) {
    return res
      .status(err.errorCode)
      .send({ result: { success: false, message: err.message } });
  }

  return res.status(500).send({
    result: {
      success: false,
      message: "Unexpected Error has occured",
      status: "ERROR"
    }
  });
}

export async function registerError(
  userId: string,
  path: string,
  parameters: any,
  jwtToken: string,
  err: any
) {
  const errorMessage = {
    message: err.message,
    name: err.name,
    stack: err.stack,
    code: err.errorCode || "UNKNOWN",
    type: err.errorType || "UNKNOWN"
  };

  const supabase = createSupabaseClient();

  const { error } = await supabase.from("error_logs").insert([
    {
      user_id: userId,
      path: path,
      parameters: parameters || {}, // Default to empty object if null/undefined
      jwt_token: jwtToken,
      error_message: JSON.stringify(errorMessage)
    }
  ]);
  if (error) {
    console.error("Error in logging error mechanism:", error);
    return false;
  }
  return true;
}

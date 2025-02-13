/* eslint-disable max-len */
import { ZodError, z } from "zod";

export abstract class HttpException extends Error {
  abstract errorCode: number;
  abstract errorType: string;
  protected error: string;

  constructor(message: string, error: string) {
    super(message);
    this.error = error;
    Object.setPrototypeOf(this, HttpException.prototype);
  }

  abstract serializeErrors(): { message: string; error: string; details?: any };
}

export default HttpException;

export class BadRequestException extends HttpException {
  errorCode = 400;
  errorType = "BADREQUEST_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, BadRequestException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class GameEndedErrorException extends HttpException {
  errorCode = 400; // Use an appropriate HTTP status code
  errorType = "GAME_ENDED_ERROR";
  private gameState: any; // Specific game state information

  constructor(message: string, gameState: any) {
    super(message, "NFT game has ended!");
    this.gameState = gameState;

    Object.setPrototypeOf(this, GameEndedErrorException.prototype);
  }

  serializeErrors() {
    return {
      message: this.message,
      error: this.error,
      details: { game_state: this.gameState }
    };
  }
}

export class ZodValidationException extends Error {
  errorCode = 400;
  errorType = "ZOD_VALIDATION_ERROR";
  private zodError: ZodError;

  constructor(zodError: ZodError) {
    super("Zod validation error");
    this.zodError = zodError;
    Object.setPrototypeOf(this, ZodValidationException.prototype);
  }

  serializeErrors() {
    const errorMessages = this.zodError.errors.reduce<{
      [key: string]: string;
    }>((acc, error) => {
      const key =
        error.code === z.ZodIssueCode.invalid_type &&
        error.received === "undefined"
          ? "Missing"
          : "Invalid value for";
      const lastElement = `${error.path[error.path.length - 1]}`;
      acc[key] = acc[key] ? `${acc[key]}, ${lastElement}` : lastElement;
      return acc;
    }, {});

    const formattedMessage = Object.entries(errorMessages)
      .map(([key, value]) => `${key} parameters \`${value}\``)
      .join(" & ");

    return {
      message: formattedMessage,
      errorDetails: this.zodError.errors
    };
  }
}

export class UnauthorizedException extends HttpException {
  errorCode = 401;
  errorType = "UNAUTHORIZED_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class ForbiddenException extends HttpException {
  errorCode = 403;
  errorType = "FORBIDDEN_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class NotFoundException extends HttpException {
  errorCode = 404;
  errorType = "NOTFOUND_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, NotFoundException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class ConflictException extends HttpException {
  errorCode = 409;
  errorType = "CONFLICT_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, ConflictException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class RateLimitException extends HttpException {
  errorCode = 429;
  errorType = "RATELIMITING_ERROR";
  constructor(message: string, error: string) {
    super(message, error);

    Object.setPrototypeOf(this, RateLimitException.prototype);
  }

  serializeErrors() {
    return { message: this.message, error: this.error };
  }
}

export class InternalServerErrorException extends HttpException {
  errorCode = 500;
  errorType = "INTERNALSERVER_ERROR";

  constructor(message: string, error: string) {
    super(message, error);
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }

  serializeErrors() {
    return {
      message: this.message,
      error: this.error
    };
  }
}

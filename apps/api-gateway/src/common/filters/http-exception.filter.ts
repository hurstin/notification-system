import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseFormat } from '../interfaces/response.interface';

/**
 * Global HTTP Exception Filter
 *
 * This filter acts as a safety net that catches ANY unhandled exceptions thrown across
 * the entire NestJS application. Instead of letting NestJS return its default error format,
 * this filter forces all errors into our standardized `ResponseFormat` so frontend clients
 * have a predictable error schematic (success: false, message: string, error?: string).
 */
@Catch() // @Catch() without arguments means it catches *all* exceptions, not just HttpExceptions.
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * The catch method is invoked whenever an exception occurs.
   * @param exception The actual error object that was thrown (could be a NestJS HttpException, a generic JS Error, or something else)
   * @param host The execution context host, giving us access to the underlying HTTP Express request/response objects.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>(); // The native Express response object so we can send the final JSON.

    // 1. Determine the exact HTTP Status Code to return
    // If it's a known NestJS HTTP exception (like NotFoundException or BadRequestException), use its status.
    // Otherwise, default to a generic 500 Internal Server Error.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Default fallback messages
    let message = 'Internal server error';
    let errorDetails: string | undefined;

    // 2. Parse the exception to extract meaningful messages for the end-user
    if (exception instanceof HttpException) {
      // NestJS HttpExceptions often contain an internal object with a `message` and `error` field.
      // E.g., The ValidationPipe throws { statusCode: 400, message: ["email must be valid"], error: "Bad Request" }
      const responseBody = exception.getResponse();

      // Check if the response body is a structured object
      if (typeof responseBody === 'object' && responseBody !== null) {
        const r = responseBody as Record<string, unknown>;

        // Scenario A: Validation errors return an Array of messages. We just take the first one
        // to keep the `message` cleanly formatted as a simple string for the UI.
        if (Array.isArray(r.message)) {
          message = String(r.message[0]);
          errorDetails = typeof r.error === 'string' ? r.error : undefined;
        }
        // Scenario B: The message is a simple string.
        else if (typeof r.message === 'string') {
          message = r.message;
          errorDetails = typeof r.error === 'string' ? r.error : undefined;
        }
        // Scenario C: No `message` property, fallback to `error` property or the generic exception message.
        else {
          message = typeof r.error === 'string' ? r.error : exception.message;
        }
      }
      // If the response body was just a raw string instead of an object.
      else {
        message =
          typeof responseBody === 'string' ? responseBody : exception.message;
      }
    }
    // 3. Handle generic Javascript errors (e.g. `throw new Error("Something broke")`)
    else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = exception.name; // e.g., 'TypeError', 'ReferenceError'
    }

    // 4. Construct the final standardized response payload
    const errorResponse: ResponseFormat = {
      success: false, // Hardcoded to false because this is the error flow
      message, // The human readable string we extracted above
      // Only include the `error` property if we found specific details (like 'Bad Request' or 'TypeError')
      ...(errorDetails ? { error: errorDetails } : {}),
    };

    // 5. Send the crafted JSON payload back to the client with the correct HTTP status code.
    response.status(status).json(errorResponse);
  }
}

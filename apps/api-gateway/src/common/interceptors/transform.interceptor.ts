import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PaginationMeta,
  ResponseFormat,
} from '../interfaces/response.interface';

/**
 * Global Response Transform Interceptor
 *
 * This interceptor intercepts the successful responses returned by any controller
 * in the NestJS application and standardizes them into a single, predictable structure
 * defined by the `ResponseFormat` interface.
 *
 * Why do we need this?
 * Standardizing the API response format ensures that the frontend always knows exactly
 * how to parse data, errors, and pagination metadata, no matter which endpoint is called.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  /**
   * The core method of an Interceptor. It has access to the ExecutionContext
   * (details about the current request) and a CallHandler (which triggers the actual controller).
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    // next.handle() executes the actual route handler (the controller method).
    // The `.pipe(map(...))` function transforms the raw data returned heavily by the controller
    // before it gets sent back to the client.
    return next.handle().pipe(
      map((res: unknown) => {
        // SCENARIO 1: The controller returned an object that ALREADY HAS some of our standardized keys.
        // For example, if a controller Returns: { data: [1,2,3], meta: { page: 1 }, message: "Loaded items" }
        // We want to extract those specific keys so we don't accidentally nest them inside another `data` object.
        if (
          res &&
          typeof res === 'object' &&
          ('data' in res || 'meta' in res || 'message' in res)
        ) {
          // Destructure the known keys we care about. Any leftover unstructured properties
          // will be bundled together into the `rest` object.
          const r = res as Record<string, unknown>;
          const { data, meta, message, success, ...rest } = r;

          return {
            // Guarantee success is a boolean (defaults to true if the controller didn't explicitly provide it)
            success: typeof success === 'boolean' ? success : true,

            // Allow the controller to provide a custom success message, or fallback to "Success"
            message: typeof message === 'string' ? message : 'Success',

            // Construct the actual data payload:
            // 1. If the controller passed a distinct `data:` property, use it.
            // 2. If the controller didn't pass `data:`, but passed other unstructured properties (the `rest`),
            //    group those unstructured properties and treat THEM as the data.
            // 3. Otherwise, set it to undefined.
            data:
              data !== undefined
                ? (data as T)
                : Object.keys(rest).length
                  ? (rest as T)
                  : undefined,

            // If pagination/meta details were provided, spread them into the final response
            ...(meta ? { meta: meta as PaginationMeta } : {}),
          };
        }

        // SCENARIO 2: The controller returned a raw value (e.g. returning an Array [] or a simple User object)
        // In this case, we wrap the entire raw return value seamlessly inside the `data` property.
        return {
          success: true,
          message: 'Success',
          data: res as T, // <--- Raw controller output is packaged gracefully here
        };
      }),
    );
  }
}

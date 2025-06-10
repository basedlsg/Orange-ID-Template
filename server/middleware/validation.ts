import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Creates a validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: 'Validation error',
          details: validationError.details
        });
      }
      next(error);
    }
  };
}

/**
 * Creates a validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request<any, any, any, T>, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as T;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validationError.details
        });
      }
      next(error);
    }
  };
}

/**
 * Creates a validation middleware for route parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as T;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          error: 'Invalid route parameters',
          details: validationError.details
        });
      }
      next(error);
    }
  };
}
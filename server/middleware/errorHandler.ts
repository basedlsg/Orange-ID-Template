import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Creates a standardized API error
 */
export function createApiError(message: string, statusCode: number = 500, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Global error handling middleware
 */
export function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction) {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    return res.status(400).json({
      error: 'Validation error',
      details: validationError.details
    });
  }

  // Handle known API errors
  if ('statusCode' in err && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details })
    });
  }

  // Handle database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference to related resource'
    });
  }

  // Default error response
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(`[${req.method}] ${req.url} - Error:`, err.message);
  console.error("Full error object:", JSON.stringify(err, null, 2));
  
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
    return;
  }

  // Unknown errors
  console.error("Unexpected error details:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      message: err.message,
      stack: err.stack,
      details: (err as any).errorDetails || (err as any).response?.data,
    }),
  });
};

// Global error handler — catches all errors and returns consistent JSON responses
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error in development
  if (config.isDev) {
    console.error('❌ Error:', err.message);
    if (!(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Multer errors
  if (err.message?.includes('yüklenebilir') || err.message?.includes('File too large')) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    message: config.isDev ? err.message : 'Sunucu hatası oluştu',
  });
}

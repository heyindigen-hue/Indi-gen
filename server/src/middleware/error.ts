import { ErrorRequestHandler } from 'express';
import { logger } from '../logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  logger.error({ err, path: req.path, method: req.method }, 'request error');
  res.status(status).json({
    error: err.code || err.name || 'InternalError',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to generate and set CSRF token cookie on safe requests.
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (!req.cookies.csrfToken) {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false, // Must be readable by client JS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
  next();
}

/**
 * Middleware to validate CSRF token on mutating requests (POST, PUT, DELETE).
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'CSRF token validation failed: Request untrusted' });
    return;
  }

  next();
}

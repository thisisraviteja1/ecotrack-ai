import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from '../../src/middleware/auth';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback_access_token_secret_12345';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should return 401 if authorization header is missing', () => {
      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token is missing' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is not bearer', () => {
      mockRequest.headers = { authorization: '' };
      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 for an invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired access token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next and set req.user for a valid token', () => {
      const payload = { id: 'user-123', email: 'test@example.com', role: 'USER' };
      const token = jwt.sign(payload, ACCESS_TOKEN_SECRET);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toMatchObject(payload);
    });
  });

  describe('adminMiddleware', () => {
    it('should return 403 if req.user is missing', () => {
      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied: Admin permissions required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if req.user.role is not ADMIN', () => {
      mockRequest.user = { id: 'user-123', email: 'test@example.com', role: 'USER' };
      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied: Admin permissions required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if req.user.role is ADMIN', () => {
      mockRequest.user = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
      adminMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});

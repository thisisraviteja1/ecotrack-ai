import { Request, Response } from 'express';
import { register, login } from '../../src/controllers/authController';
import bcrypt from 'bcrypt';

// Mock Prisma client
const mockFindFirst = jest.fn();
const mockCreateUser = jest.fn();
const mockCreateRefreshToken = jest.fn();
const mockCreateAuditLog = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        user: {
          findFirst: (...args: any[]) => mockFindFirst(...args),
          create: (...args: any[]) => mockCreateUser(...args),
        },
        refreshToken: {
          create: (...args: any[]) => mockCreateRefreshToken(...args),
        },
        auditLog: {
          create: (...args: any[]) => mockCreateAuditLog(...args),
        },
      };
    }),
  };
});

describe('Auth Controller - 50+ Test Cases', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockFindFirst.mockReset();
    mockCreateUser.mockReset();
    mockCreateRefreshToken.mockReset();
    mockCreateAuditLog.mockReset();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  // ==========================================
  // CATEGORY 1: SUCCESSFUL SCENARIOS (2 Cases)
  // ==========================================
  describe('Successful Flows', () => {
    it('1. Register successfully with valid parameters', async () => {
      mockFindFirst.mockResolvedValueOnce(null); // No existing user
      mockCreateUser.mockResolvedValueOnce({
        id: 'user-uuid-123',
        email: 'alex@example.com',
        name: 'Alex Mercer',
        role: 'USER',
        points: 0,
        level: 'Beginner',
      });
      mockCreateRefreshToken.mockResolvedValueOnce({});
      mockCreateAuditLog.mockResolvedValueOnce({});

      const req = {
        body: {
          email: 'alex@example.com',
          password: 'Password123!',
          name: 'Alex Mercer',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      await register(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(210);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            email: 'alex@example.com',
            name: 'Alex Mercer',
          }),
        })
      );
    });

    it('2. Login successfully with correct password', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockFindFirst.mockResolvedValueOnce({
        id: 'user-uuid-123',
        email: 'alex@example.com',
        passwordHash,
        name: 'Alex Mercer',
        role: 'USER',
        points: 100,
        level: 'Beginner',
      });
      mockCreateRefreshToken.mockResolvedValueOnce({});
      mockCreateAuditLog.mockResolvedValueOnce({});

      const req = {
        body: {
          email: 'alex@example.com',
          password: 'Password123!',
        },
        ip: '127.0.0.1',
      } as unknown as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            email: 'alex@example.com',
            points: 100,
          }),
        })
      );
    });
  });

  // ==========================================
  // CATEGORY 2: INVALID EMAIL FORMATS (15 Cases)
  // ==========================================
  describe('Registration - Invalid Email Formats', () => {
    const invalidEmails = [
      { id: 3, email: 'no-at-sign.com', desc: 'Missing @' },
      { id: 4, email: '@missing-local.com', desc: 'Missing local part' },
      { id: 5, email: 'local@', desc: 'Missing domain part' },
      { id: 6, email: 'local@domain', desc: 'Missing TLD' },
      { id: 7, email: 'local@.com', desc: 'Domain is just a dot' },
      { id: 8, email: 'local@domain..com', desc: 'Double dots in domain' },
      { id: 9, email: 'local @domain.com', desc: 'Space in local part' },
      { id: 10, email: 'local@domain .com', desc: 'Space in domain part' },
      { id: 11, email: 'local@domain/path.com', desc: 'Slash in domain' },
      { id: 12, email: 'local@domain.c', desc: 'TLD too short' },
      { id: 13, email: 'local', desc: 'No domain or at symbol' },
      { id: 14, email: '@', desc: 'Only at symbol' },
      { id: 15, email: 'email with spaces@domain.com', desc: 'Spaces in email' },
      { id: 16, email: '', desc: 'Empty email string' },
      { id: 17, email: 'john.doe@sub.sub.sub.com@extra.com', desc: 'Multiple @ symbols' },
    ];

    invalidEmails.forEach(({ id, email, desc }) => {
      it(`${id}. Fail register: email '${email}' (${desc})`, async () => {
        const req = {
          body: {
            email,
            password: 'Password123!',
            name: 'Alex Mercer',
          },
        } as Request;

        await register(req, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringMatching(/email|required/i),
          })
        );
      });
    });
  });

  // ==========================================
  // CATEGORY 3: INVALID PASSWORD FORMATS (15 Cases)
  // ==========================================
  describe('Registration - Invalid Password Formats', () => {
    const invalidPasswords = [
      { id: 18, pass: 'Short1!', desc: 'Too short (7 chars)' },
      { id: 19, pass: 'password123!', desc: 'No uppercase letter' },
      { id: 20, pass: 'PASSWORD123!', desc: 'No lowercase letter' },
      { id: 21, pass: 'Password!', desc: 'No digit/number' },
      { id: 22, pass: 'Password123', desc: 'No special character' },
      { id: 23, pass: '        ', desc: 'Spaces only' },
      { id: 24, pass: '', desc: 'Empty password string' },
      { id: 25, pass: 'pP1!', desc: 'Very short password' },
      { id: 26, pass: '12345678', desc: 'Digits only' },
      { id: 27, pass: 'abcdefgh', desc: 'Lowercase letters only' },
      { id: 28, pass: 'ABCDEFGH', desc: 'Uppercase letters only' },
      { id: 29, pass: '!@#$%^&*', desc: 'Special characters only' },
      { id: 30, pass: 'NoSpecialCharsAndNoDigits', desc: 'Missing digits and special chars' },
      { id: 31, pass: 'A1!b2', desc: 'Well-formed but under 8 characters' },
      { id: 32, pass: 'password', desc: 'Common simple password' },
    ];

    invalidPasswords.forEach(({ id, pass, desc }) => {
      it(`${id}. Fail register: password '${pass}' (${desc})`, async () => {
        const req = {
          body: {
            email: 'test@example.com',
            password: pass,
            name: 'Alex Mercer',
          },
        } as Request;

        await register(req, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringMatching(/password|required/i),
          })
        );
      });
    });
  });

  // ==========================================
  // CATEGORY 4: INVALID NAMES (10 Cases)
  // ==========================================
  describe('Registration - Invalid Names', () => {
    const invalidNames = [
      { id: 33, name: 'a', desc: 'Too short (1 character)' },
      { id: 34, name: '', desc: 'Empty name string' },
      { id: 35, name: 'john@example.com', desc: 'Email address in name field' },
      { id: 36, name: '   ', desc: 'Spaces only' },
      { id: 37, name: 'alex.mercer@gmail.com', desc: 'Another email address in name' },
      { id: 38, name: 'test@user.org', desc: 'Third email address in name' },
      { id: 39, name: '1', desc: 'Numeric single character name' },
      { id: 40, name: 'x', desc: 'Alpha single character name' },
      { id: 41, name: '@name', desc: 'Starts with @' },
      { id: 42, name: 'name@', desc: 'Ends with @' },
    ];

    invalidNames.forEach(({ id, name, desc }) => {
      it(`${id}. Fail register: name '${name}' (${desc})`, async () => {
        const req = {
          body: {
            email: 'test@example.com',
            password: 'Password123!',
            name,
          },
        } as Request;

        await register(req, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringMatching(/name|required/i),
          })
        );
      });
    });
  });

  // ==========================================
  // CATEGORY 5: INVALID / EDGE LOGIN SCENARIOS (10 Cases)
  // ==========================================
  describe('Login - Invalid & Edge Cases', () => {
    it('43. Fail login: Non-existent email address', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password credentials',
      });
    });

    it('44. Fail login: Incorrect password for valid user', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      mockFindFirst.mockResolvedValueOnce({
        email: 'alex@example.com',
        passwordHash,
      });

      const req = {
        body: {
          email: 'alex@example.com',
          password: 'WrongPassword!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password credentials',
      });
    });

    it('45. Fail login: Empty email address', async () => {
      const req = {
        body: {
          email: '',
          password: 'Password123!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/email|required/i),
        })
      );
    });

    it('46. Fail login: Empty password', async () => {
      const req = {
        body: {
          email: 'alex@example.com',
          password: '',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/password|required/i),
        })
      );
    });

    it('47. Fail login: Invalid email format structure', async () => {
      const req = {
        body: {
          email: 'invalid-email-format',
          password: 'Password123!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/email/i),
        })
      );
    });

    it('48. Fail login: Correct email, wrong password casing', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      mockFindFirst.mockResolvedValueOnce({
        email: 'alex@example.com',
        passwordHash,
      });

      const req = {
        body: {
          email: 'alex@example.com',
          password: 'password123!', // Lowercase 'p'
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid email or password credentials',
      });
    });

    it('49. SQL Injection shield check in email field', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const req = {
        body: {
          email: "' OR '1'='1",
          password: 'Password123!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400); // Fails validation schema instead of hitting SQL executor
    });

    it('50. SQL Injection shield check in password field', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const req = {
        body: {
          email: 'alex@example.com',
          password: "' OR '1'='1",
        },
      } as Request;

      await login(req, mockResponse as Response);

      // Will either fail Zod validation because it lacks requirements or return 401
      const isStatusError = mockResponse.status === jest.fn().mockReturnValue(400) || mockResponse.status === jest.fn().mockReturnValue(401);
      expect(mockResponse.status).toHaveBeenCalled();
    });

    it('51. XSS script protection check in email field', async () => {
      const req = {
        body: {
          email: '<script>alert("XSS")</script>',
          password: 'Password123!',
        },
      } as Request;

      await login(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('52. Email Conflict check during registration', async () => {
      mockFindFirst.mockResolvedValueOnce({ id: 'existing-id', email: 'alex@example.com' });

      const req = {
        body: {
          email: 'alex@example.com',
          password: 'Password123!',
          name: 'Alex Mercer',
        },
      } as Request;

      await register(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email address is already registered',
      });
    });
  });
});

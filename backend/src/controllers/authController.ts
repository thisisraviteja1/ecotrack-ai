import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../utils/validation';

const prisma = new PrismaClient();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'fallback_access_token_secret_12345';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_token_secret_54321';

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Helper to generate access token
function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ id: userId, email, role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// Helper to generate refresh token
function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, REFRESH_TOKEN_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
}

// Helper to write audit log
async function writeAudit(userId: string | null, action: string, details: string, ipAddress?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: ipAddress || null
      }
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

/**
 * Register user.
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name } = validatedData;

    // Check if email taken
    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email address is already registered' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER',
        level: 'Beginner',
        points: 0
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const rawRefreshToken = generateRefreshToken(user.id, user.email);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Write audit log
    await writeAudit(user.id, 'USER_REGISTER', `User registered: ${user.email}`, req.ip);

    // Set refresh token cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(210).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        level: user.level
      }
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Login user.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Fetch user
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials' });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const rawRefreshToken = generateRefreshToken(user.id, user.email);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Write audit log
    await writeAudit(user.id, 'USER_LOGIN', `User logged in: ${user.email}`, req.ip);

    // Set refresh token cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        level: user.level
      }
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Refresh Token rotation logic.
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies.refreshToken;
  if (!cookieToken) {
    res.status(401).json({ error: 'Refresh token is missing' });
    return;
  }

  // Clear cookie immediately for rotation
  res.clearCookie('refreshToken');

  try {
    const decoded = jwt.verify(cookieToken, REFRESH_TOKEN_SECRET) as { id: string; email: string };
    
    // Find refresh token in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: cookieToken },
      include: { user: true }
    });

    // REPLAY ATTACK DETECTION:
    // If the token is valid but doesn't exist in the database, or has revokedAt set, it means
    // it was already rotated or used! We must revoke ALL active sessions for this user.
    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
      if (dbToken) {
        // Revoke all tokens for this user
        await prisma.refreshToken.updateMany({
          where: { userId: dbToken.userId },
          data: { revokedAt: new Date() }
        });
        await writeAudit(dbToken.userId, 'REFRESH_TOKEN_REPLAY', `Potential replay attack detected. Revoked all tokens.`, req.ip);
      }
      res.status(403).json({ error: 'Unauthorized: Session compromised' });
      return;
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() }
    });

    // Generate new pair
    const accessToken = generateAccessToken(dbToken.userId, dbToken.user.email, dbToken.user.role);
    const newRefreshToken = generateRefreshToken(dbToken.userId, dbToken.user.email);

    // Save new token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: dbToken.userId,
        expiresAt
      }
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Invalid refresh token' });
  }
}

/**
 * Logout.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies.refreshToken;
  if (cookieToken) {
    try {
      // Revoke in DB
      await prisma.refreshToken.updateMany({
        where: { token: cookieToken },
        data: { revokedAt: new Date() }
      });
    } catch (err) {
      console.error('Logout db update failed:', err);
    }
  }

  res.clearCookie('refreshToken');
  res.status(200).json({ success: true });
}

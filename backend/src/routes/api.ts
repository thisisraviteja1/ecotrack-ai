import { Router } from 'express';
import multer from 'multer';
import * as apiController from '../controllers/apiController';
import * as authController from '../controllers/authController';
import { authMiddleware, authRateLimiter } from '../middleware/auth';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB upload limit
});

// ==========================================
// Public Authentication Routes
// ==========================================
router.post('/auth/register', authRateLimiter, authController.register);
router.post('/auth/login', authRateLimiter, authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// ==========================================
// Protected Core Application Routes
// ==========================================
router.get('/auth/profile', authMiddleware, apiController.getProfile);

// Carbon Footprint Calculator
router.post('/calculator', authMiddleware, apiController.calculateFootprint);

// Carbon Dashboard Telemetry
router.get('/dashboard', authMiddleware, apiController.getDashboard);

// Daily Habit Tracker
router.post('/habits', authMiddleware, apiController.updateDailyHabits);

// Green Challenges & Missions
router.get('/challenges', authMiddleware, apiController.getChallenges);
router.post('/challenges/join', authMiddleware, apiController.joinChallenge);
router.post('/challenges/complete', authMiddleware, apiController.completeChallenge);

// Community Leaderboard
router.get('/leaderboard', authMiddleware, apiController.getLeaderboard);

// Carbon Offset Marketplace
router.post('/offset/buy', authMiddleware, apiController.buyOffset);

// AI Sustainability Coach & Receipt Scanner
router.post('/ai/coach', authMiddleware, apiController.askCoach);
router.post('/ai/scan-receipt', authMiddleware, upload.single('file'), apiController.uploadReceipt);

// Dynamic PDF Report download
router.get('/reports/pdf', authMiddleware, apiController.generatePDFReport);

export default router;

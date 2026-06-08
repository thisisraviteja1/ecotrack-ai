import { Router } from 'express';
import multer from 'multer';
import * as apiController from '../controllers/apiController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Authentication & Users
router.post('/auth/register', apiController.registerOrGetUser);

// Carbon Footprint Calculator
router.post('/calculator', apiController.calculateFootprint);

// Dashboard Data
router.get('/dashboard/:userId', apiController.getDashboard);

// Daily Habit Tracker
router.post('/habits', apiController.updateDailyHabits);

// Green Challenges
router.get('/challenges', apiController.getChallenges);
router.post('/challenges/join', apiController.joinChallenge);
router.post('/challenges/complete', apiController.completeChallenge);

// Community Leaderboard
router.get('/leaderboard', apiController.getLeaderboard);

// Carbon Offset Marketplace
router.post('/offset/buy', apiController.buyOffset);

// AI Assistant & Receipt Scanner
router.post('/ai/coach', apiController.askCoach);
router.post('/ai/scan-receipt', upload.single('file'), apiController.uploadReceipt);

// Dynamic PDF Report download
router.get('/reports/pdf/:userId', apiController.generatePDFReport);

export default router;

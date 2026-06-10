import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import * as geminiService from '../services/gemini';
import { calculationSchema, habitsSchema } from '../utils/validation';
import { calculateCarbonMath } from '../utils/carbonMath';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

const LEVEL_EXPLORER = 300;
const LEVEL_HERO = 700;
const LEVEL_CHAMPION = 1200;

function getUserLevel(points: number): string {
  if (points >= LEVEL_CHAMPION) return 'Climate Champion';
  if (points >= LEVEL_HERO) return 'Sustainability Hero';
  if (points >= LEVEL_EXPLORER) return 'Eco Explorer';
  return 'Beginner';
}

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
 * Fetch authenticated user profile.
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: req.user.id, deletedAt: null }
    });

    if (!user) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      points: user.points,
      level: user.level
    });
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Calculate carbon footprint emissions.
 */
export async function calculateFootprint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = calculationSchema.parse(req.body);
    const {
      transportMode,
      travelDistance,
      electricity,
      acUsage,
      diet,
      shoppingOnline,
      shoppingFashion,
      recyclingHabit,
      plasticUsage
    } = validatedData;

    const userId = req.user.id;

    const {
      transportCO2,
      energyCO2,
      foodCO2,
      shoppingCO2,
      wasteCO2,
      totalCO2,
      carbonScore,
      rating
    } = calculateCarbonMath({
      transportMode,
      travelDistance,
      electricity,
      acUsage,
      diet,
      shoppingOnline,
      shoppingFashion,
      recyclingHabit,
      plasticUsage
    });

    // Soft-delete older calculations for user
    await prisma.calculation.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    // Save calculation
    const calculation = await prisma.calculation.create({
      data: {
        userId,
        transportMode,
        travelDistance,
        electricity,
        acUsage,
        diet,
        shoppingOnline,
        shoppingFashion,
        recyclingHabit,
        plasticUsage,
        transportCO2,
        energyCO2,
        foodCO2,
        shoppingCO2,
        wasteCO2,
        totalCO2,
        carbonScore,
        rating
      }
    });

    // Update user points
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: user.points + 50,
          level: getUserLevel(user.points + 50)
        }
      });
      await writeAudit(userId, 'SUBMIT_CALCULATION', `Calculated carbon score: ${carbonScore}, rating: ${rating}`, req.ip);
      res.json({ calculation, pointsAwarded: 50, updatedUser });
      return;
    }

    res.json({ calculation, pointsAwarded: 0 });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Calculate Carbon Footprint Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get dashboard stats.
 */
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Get User profile
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get latest calculation
    const calculations = await prisma.calculation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    const latestCalc = calculations[0] || null;

    // Get weekly progress on daily habits (last 7 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const habits = await prisma.dailyHabit.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    // Enrolled challenges
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId },
      include: { challenge: true }
    });

    // AI prediction
    const prediction = await geminiService.predictEmissions(latestCalc, habits);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
        level: user.level
      },
      latestCalculation: latestCalc,
      habits,
      activeChallenges: userChallenges.filter((uc: any) => uc.status === 'IN_PROGRESS'),
      completedChallenges: userChallenges.filter((uc: any) => uc.status === 'COMPLETED'),
      prediction,
      reductionPercentage: latestCalc ? prediction.reductionPercent : 0
    });
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Toggle daily habits.
 */
export async function updateDailyHabits(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = habitsSchema.parse(req.body);
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find if habit entry exists for today
    let dailyHabit = await prisma.dailyHabit.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Points calculation: 10 points per ticked habit
    let pointsAwarded = 0;
    const oldScore = dailyHabit ? dailyHabit.pointsEarned : 0;
    let newScore = 0;

    if (validatedData.usedBicycle) newScore += 10;
    if (validatedData.avoidedPlastic) newScore += 10;
    if (validatedData.usedPublicTransport) newScore += 10;
    if (validatedData.savedElectricity) newScore += 10;
    if (validatedData.recycledWaste) newScore += 10;
    if (validatedData.carpooled) newScore += 10;

    pointsAwarded = newScore - oldScore;

    if (dailyHabit) {
      dailyHabit = await prisma.dailyHabit.update({
        where: { id: dailyHabit.id },
        data: {
          ...validatedData,
          pointsEarned: newScore
        }
      });
    } else {
      dailyHabit = await prisma.dailyHabit.create({
        data: {
          userId,
          date: new Date(),
          ...validatedData,
          pointsEarned: newScore
        }
      });
    }

    // Update user points
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (user && pointsAwarded !== 0) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: Math.max(0, user.points + pointsAwarded),
          level: getUserLevel(Math.max(0, user.points + pointsAwarded))
        }
      });
      await writeAudit(userId, 'UPDATE_HABITS', `Habit check-in: +${pointsAwarded} XP`, req.ip);
      res.json({ dailyHabit, pointsAwarded, user: updatedUser });
      return;
    }

    res.json({ dailyHabit, pointsAwarded, user });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Habit Update Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * List challenges.
 */
export async function getChallenges(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const challenges = await prisma.challenge.findMany();
    res.json(challenges);
  } catch (error: any) {
    console.error('Get Challenges Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Join challenge.
 */
export async function joinChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { challengeId } = req.body;
    if (!challengeId) {
      res.status(400).json({ error: 'challengeId is required' });
      return;
    }

    const userId = req.user.id;

    // Check if user is already in this challenge
    const existing = await prisma.userChallenge.findFirst({
      where: { userId, challengeId, status: 'IN_PROGRESS' }
    });

    if (existing) {
      res.status(400).json({ error: 'Already enrolled in this challenge' });
      return;
    }

    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        status: 'IN_PROGRESS'
      },
      include: { challenge: true }
    });

    await writeAudit(userId, 'JOIN_CHALLENGE', `Joined challenge ID: ${challengeId}`, req.ip);
    res.json(userChallenge);
  } catch (error: any) {
    console.error('Join Challenge Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Complete challenge and claim points.
 */
export async function completeChallenge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userChallengeId } = req.body;
    if (!userChallengeId) {
      res.status(400).json({ error: 'userChallengeId is required' });
      return;
    }

    const uc = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true, user: true }
    });

    if (!uc || uc.userId !== req.user.id) {
      res.status(404).json({ error: 'Enrolled challenge not found or unauthorized' });
      return;
    }

    if (uc.status === 'COMPLETED') {
      res.status(400).json({ error: 'Challenge already completed' });
      return;
    }

    // Complete challenge
    const updatedUc = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Award points
    const rewardPoints = uc.challenge.points;
    const updatedUser = await prisma.user.update({
      where: { id: uc.userId },
      data: {
        points: uc.user.points + rewardPoints,
        level: getUserLevel(uc.user.points + rewardPoints)
      }
    });

    await writeAudit(req.user.id, 'COMPLETE_CHALLENGE', `Completed challenge: ${uc.challenge.title}, +${rewardPoints} XP`, req.ip);
    res.json({ userChallenge: updatedUc, pointsAwarded: rewardPoints, user: updatedUser });
  } catch (error: any) {
    console.error('Complete Challenge Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Eco Coach Chatbot endpoint.
 */
export async function askCoach(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { history, message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const coachHistory = history || [];
    const reply = await geminiService.chatCoach(coachHistory, message);
    res.json({ reply });
  } catch (error: any) {
    console.error('Ask Coach Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Receipt Scanner endpoint.
 */
export async function uploadReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user.id;
    const result = await geminiService.scanReceipt(file.buffer, file.mimetype);

    // Save scan to database
    const scan = await prisma.receiptScan.create({
      data: {
        userId,
        fileName: file.originalname,
        fileType: file.mimetype.includes('image') ? 'image' : 'document',
        amount: result.amount,
        co2Estimate: result.co2Estimate,
        rawText: result.rawText
      }
    });

    // Award 30 eco points
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    let updatedUser = user;
    if (user) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: user.points + 30,
          level: getUserLevel(user.points + 30)
        }
      });
    }

    await writeAudit(userId, 'UPLOAD_RECEIPT', `Scanned receipt: ${file.originalname}, estimated: ${result.co2Estimate} kg CO2`, req.ip);
    res.json({ scan, result, pointsAwarded: 30, user: updatedUser });
  } catch (error: any) {
    console.error('Upload Receipt Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetch Leaderboard rankings.
 */
export async function getLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { points: 'desc' },
      take: 10
    });
    
    const mapped = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      points: u.points,
      level: u.level
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error('Leaderboard Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Spend green points in Carbon Offset Marketplace.
 */
export async function buyOffset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { cost, name } = req.body;
    if (!cost || !name) {
      res.status(400).json({ error: 'cost and offset project name are required' });
      return;
    }

    const userId = req.user.id;

    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.points < cost) {
      res.status(400).json({ error: `Insufficient green points. You need ${cost} but have ${user.points}.` });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: user.points - cost
      }
    });

    await writeAudit(userId, 'BUY_OFFSET', `Redeemed offset: ${name}, cost: ${cost} XP`, req.ip);

    res.json({
      success: true,
      message: `Successfully purchased offset: ${name}! Spent ${cost} points.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        points: updatedUser.points,
        level: updatedUser.level
      }
    });
  } catch (error: any) {
    console.error('Buy Offset Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Generate PDF sustainability report.
 */
export async function generatePDFReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const calculations = await prisma.calculation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    const latestCalc = calculations[0] || null;

    const safeName = user.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EcoTrack-Report-${safeName}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Colors
    const primaryColor = '#10B981'; 
    const secondaryColor = '#065F46'; 
    const darkGray = '#1F2937';
    const lightGray = '#F3F4F6';

    // Header Title
    doc.fillColor(secondaryColor).fontSize(28).text('EcoTrack AI', 50, 50);
    doc.fillColor(primaryColor).fontSize(14).text('Understand Your Impact. Reduce Your Footprint. Save the Planet.', 50, 85);
    doc.moveDown(1.5);

    // Horizontal line
    doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, 105).lineTo(550, 105).stroke();
    doc.moveDown(2);

    // Profile Details
    doc.fillColor(darkGray).fontSize(16).text('Sustainability Report Summary', 50, 125);
    doc.fontSize(11).fillColor('#4B5563');
    doc.text(`User Profile: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Total Eco Points: ${user.points} XP`);
    doc.text(`Achievement Level: ${user.level}`);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(1.5);

    if (latestCalc) {
      // Carbon Footprint Box
      doc.rect(50, 220, 500, 120).fillAndStroke(lightGray, primaryColor);
      
      doc.fillColor(secondaryColor).fontSize(14).text('MONTHLY CARBON FOOTPRINT', 70, 235);
      doc.fillColor(darkGray).fontSize(32).text(`${latestCalc.totalCO2.toFixed(1)} kg CO2`, 70, 255);
      
      doc.fontSize(12).fillColor('#4B5563');
      doc.text(`Carbon Efficiency Score: ${latestCalc.carbonScore} / 100`, 70, 295);
      doc.text(`Eco Rating: ${latestCalc.rating}`, 70, 310);
      
      // Emissions breakdown
      doc.moveDown(7);
      doc.fillColor(secondaryColor).fontSize(16).text('Emissions By Category');
      doc.moveDown(0.5);

      const items = [
        { name: 'Transportation', co2: latestCalc.transportCO2 },
        { name: 'Electricity & Utilities', co2: latestCalc.energyCO2 },
        { name: 'Food Choices', co2: latestCalc.foodCO2 },
        { name: 'Shopping & Consumerism', co2: latestCalc.shoppingCO2 },
        { name: 'Waste Production', co2: latestCalc.wasteCO2 },
      ];

      items.forEach((item: { name: string; co2: number }) => {
        doc.fontSize(11).fillColor(darkGray).text(`${item.name}: `, { continued: true });
        doc.fillColor(primaryColor).text(`${item.co2.toFixed(1)} kg CO2 (${((item.co2 / latestCalc.totalCO2) * 100).toFixed(0)}%)`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1.5);
      doc.fillColor(secondaryColor).fontSize(16).text('Eco-Coach Recommendations');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#374151');
      
      let recoText = '';
      if (latestCalc.transportCO2 > latestCalc.totalCO2 * 0.4) {
        recoText = '• Your transport footprint is high. Try to carpool, commute via train/metro, or replace short trips with cycling to save up to 120 kg CO2 monthly.\n\n';
      }
      if (latestCalc.energyCO2 > latestCalc.totalCO2 * 0.3) {
        recoText += '• Home electricity and AC usage are primary contributors. Set AC to 24°C and switch to smart LED bulbs to trim power emissions by 15-20%.\n\n';
      }
      if (latestCalc.foodCO2 > 150) {
        recoText += '• Shifting to a vegetable-centric diet, even for 3 days a week, will save an estimated 400 kg CO2 annually.\n\n';
      }
      if (recoText === '') {
        recoText = '• Great job maintaining a balanced carbon footprint! Focus on increasing daily recycling and reducing single-use plastics to approach carbon neutrality.';
      }

      doc.text(recoText);
    } else {
      doc.fillColor('#9CA3AF').fontSize(14).text('No Carbon Footprint calculations recorded yet. Complete your first calculation in the platform to generate a detailed report.', 50, 220);
    }

    doc.fontSize(9).fillColor('#9CA3AF').text('Generated by EcoTrack AI. Understand your impact, reduce your footprint.', 50, 700, { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('PDF Report Generation Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

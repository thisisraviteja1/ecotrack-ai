import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as geminiService from '../services/gemini';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Level thresholds
const LEVEL_EXPLORER = 300;
const LEVEL_HERO = 700;
const LEVEL_CHAMPION = 1200;

function getUserLevel(points: number): string {
  if (points >= LEVEL_CHAMPION) return 'Climate Champion';
  if (points >= LEVEL_HERO) return 'Sustainability Hero';
  if (points >= LEVEL_EXPLORER) return 'Eco Explorer';
  return 'Beginner';
}

/**
 * Register or fetch user profile.
 */
export async function registerOrGetUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          points: 0,
          level: 'Beginner'
        }
      });
      console.log(`Created new user: ${user.email}`);
    }

    res.json(user);
  } catch (error: any) {
    console.error('Register User Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Calculate carbon footprint emissions.
 * Standard emissions factors (kg CO2):
 * - Car: ~0.18 kg per km
 * - Bike: ~0.08 kg per km
 * - Bus: ~0.06 kg per km
 * - Train/Metro: ~0.04 kg per km
 * - Walking/Cycling: 0 kg per km
 * - Flight: ~150 kg per hour or ~0.15 kg per km (assume flight hours or average flight allocation: e.g. ~200 kg CO2 / month average for active flyers)
 * - Electricity: ~0.4 kg per kWh
 * - AC: ~0.8 kg per hour (assumes 1.5 kW compressor running)
 * - Diet vegetarian: ~60 kg/month, Mixed: ~150 kg/month, Non-veg: ~250 kg/month
 * - Online Shopping: ~3 kg per purchase (packaging + shipping)
 * - Fast fashion: ~15 kg per purchase
 * - Recycling Habit: Always (-15 kg), Sometimes (-5 kg), Never (0 kg)
 * - Plastic Usage: High (20 kg), Medium (10 kg), Low (2 kg)
 */
export async function calculateFootprint(req: Request, res: Response): Promise<void> {
  try {
    const {
      userId,
      transportMode,
      travelDistance, // km/day
      electricity,    // kWh/month
      acUsage,        // hours/day
      diet,           // vegetarian, mixed, non-vegetarian
      shoppingOnline,  // purchases/month
      shoppingFashion, // purchases/month
      recyclingHabit,  // always, sometimes, never
      plasticUsage    // high, medium, low
    } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Transport emissions (Monthly = Daily * 30 * Factor)
    let transportFactor = 0.18; // car default
    if (transportMode === 'bike') transportFactor = 0.08;
    else if (transportMode === 'bus') transportFactor = 0.06;
    else if (transportMode === 'train' || transportMode === 'metro') transportFactor = 0.04;
    else if (transportMode === 'walking' || transportMode === 'cycling') transportFactor = 0.0;
    else if (transportMode === 'flight') transportFactor = 0.25;

    const transportCO2 = travelDistance * 30 * transportFactor;

    // Energy emissions
    const energyElectricityCO2 = electricity * 0.4;
    const energyACCO2 = acUsage * 30 * 0.8;
    const energyCO2 = energyElectricityCO2 + energyACCO2;

    // Food emissions
    let foodCO2 = 150; // mixed
    if (diet === 'vegetarian') foodCO2 = 60;
    else if (diet === 'non-vegetarian') foodCO2 = 250;

    // Shopping emissions
    const shoppingCO2 = (shoppingOnline * 3) + (shoppingFashion * 15);

    // Waste emissions
    let wasteBase = 10;
    if (plasticUsage === 'high') wasteBase += 20;
    else if (plasticUsage === 'medium') wasteBase += 10;
    else if (plasticUsage === 'low') wasteBase += 2;

    let recyclingDeduction = 0;
    if (recyclingHabit === 'always') recyclingDeduction = -15;
    else if (recyclingHabit === 'sometimes') recyclingDeduction = -5;

    const wasteCO2 = Math.max(0, wasteBase + recyclingDeduction);

    const totalCO2 = transportCO2 + energyCO2 + foodCO2 + shoppingCO2 + wasteCO2;

    // Carbon Score calculation: 100 is excellent (low emissions), 0 is poor (high emissions)
    // Average monthly emission is ~400 kg. Score 100 for < 100 kg, scale down to 0 at 700 kg.
    const carbonScore = Math.max(1, Math.min(100, Math.round(100 - (totalCO2 / 7.5))));

    // Rating
    let rating = 'F';
    if (carbonScore >= 85) rating = 'A';
    else if (carbonScore >= 70) rating = 'B';
    else if (carbonScore >= 55) rating = 'C';
    else if (carbonScore >= 40) rating = 'D';
    else if (carbonScore >= 25) rating = 'E';

    // Save calculation
    const calculation = await prisma.calculation.create({
      data: {
        userId,
        transportMode,
        travelDistance: parseFloat(travelDistance) || 0,
        electricity: parseFloat(electricity) || 0,
        acUsage: parseFloat(acUsage) || 0,
        diet,
        shoppingOnline: parseInt(shoppingOnline) || 0,
        shoppingFashion: parseInt(shoppingFashion) || 0,
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

    // Add points for completing calculation (one-time or updates)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: user.points + 50, // 50 eco points
          level: getUserLevel(user.points + 50)
        }
      });
      res.json({ calculation, pointsAwarded: 50, updatedUser });
      return;
    }

    res.json({ calculation, pointsAwarded: 0 });
  } catch (error: any) {
    console.error('Calculate Carbon Footprint Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get dashboard information.
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Get User profile
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get latest calculation
    const calculations = await prisma.calculation.findMany({
      where: { userId },
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

    // Calculate dynamic reduction percent (baseline vs recommended)
    let reductionPercentage = 0;
    if (latestCalc) {
      reductionPercentage = prediction.reductionPercent;
    }

    res.json({
      user,
      latestCalculation: latestCalc,
      habits,
      activeChallenges: userChallenges.filter(uc => uc.status === 'IN_PROGRESS'),
      completedChallenges: userChallenges.filter(uc => uc.status === 'COMPLETED'),
      prediction,
      reductionPercentage
    });
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Toggle or check-in daily habits.
 */
export async function updateDailyHabits(req: Request, res: Response): Promise<void> {
  try {
    const { userId, habits } = req.body; // habits: { usedBicycle, avoidedPlastic, usedPublicTransport, savedElectricity, recycledWaste, carpooled }
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

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

    if (habits.usedBicycle) newScore += 10;
    if (habits.avoidedPlastic) newScore += 10;
    if (habits.usedPublicTransport) newScore += 10;
    if (habits.savedElectricity) newScore += 10;
    if (habits.recycledWaste) newScore += 10;
    if (habits.carpooled) newScore += 10;

    pointsAwarded = newScore - oldScore;

    if (dailyHabit) {
      dailyHabit = await prisma.dailyHabit.update({
        where: { id: dailyHabit.id },
        data: {
          ...habits,
          pointsEarned: newScore
        }
      });
    } else {
      dailyHabit = await prisma.dailyHabit.create({
        data: {
          userId,
          date: new Date(),
          ...habits,
          pointsEarned: newScore
        }
      });
    }

    // Update user points
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && pointsAwarded !== 0) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: Math.max(0, user.points + pointsAwarded),
          level: getUserLevel(Math.max(0, user.points + pointsAwarded))
        }
      });
      res.json({ dailyHabit, pointsAwarded, user: updatedUser });
      return;
    }

    res.json({ dailyHabit, pointsAwarded, user });
  } catch (error: any) {
    console.error('Habit Update Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * List challenges.
 */
export async function getChallenges(req: Request, res: Response): Promise<void> {
  try {
    const challenges = await prisma.challenge.findMany();
    res.json(challenges);
  } catch (error: any) {
    console.error('Get Challenges Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Join challenge.
 */
export async function joinChallenge(req: Request, res: Response): Promise<void> {
  try {
    const { userId, challengeId } = req.body;
    if (!userId || !challengeId) {
      res.status(400).json({ error: 'userId and challengeId are required' });
      return;
    }

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

    res.json(userChallenge);
  } catch (error: any) {
    console.error('Join Challenge Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Complete challenge and claim points.
 */
export async function completeChallenge(req: Request, res: Response): Promise<void> {
  try {
    const { userChallengeId } = req.body;
    if (!userChallengeId) {
      res.status(400).json({ error: 'userChallengeId is required' });
      return;
    }

    const uc = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true, user: true }
    });

    if (!uc) {
      res.status(404).json({ error: 'Enrolled challenge not found' });
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

    res.json({ userChallenge: updatedUc, pointsAwarded: rewardPoints, user: updatedUser });
  } catch (error: any) {
    console.error('Complete Challenge Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Eco Coach Chatbot endpoint.
 */
export async function askCoach(req: Request, res: Response): Promise<void> {
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
    res.status(500).json({ error: error.message });
  }
}

/**
 * Receipt Scanner endpoint.
 */
export async function uploadReceipt(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    const { userId } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

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

    // Award 30 eco points for scanning receipts
    const user = await prisma.user.findUnique({ where: { id: userId } });
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

    res.json({ scan, result, pointsAwarded: 30, user: updatedUser });
  } catch (error: any) {
    console.error('Upload Receipt Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch Leaderboard rankings.
 */
export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 10
    });
    res.json(users);
  } catch (error: any) {
    console.error('Leaderboard Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Spend green points in Carbon Offset Marketplace.
 */
export async function buyOffset(req: Request, res: Response): Promise<void> {
  try {
    const { userId, cost, name } = req.body;
    if (!userId || !cost || !name) {
      res.status(400).json({ error: 'userId, cost, and offset project name are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
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

    res.json({
      success: true,
      message: `Successfully purchased offset: ${name}! Spent ${cost} points.`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Buy Offset Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Generate PDF sustainability report.
 */
export async function generatePDFReport(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const calculations = await prisma.calculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    const latestCalc = calculations[0] || null;

    const habits = await prisma.dailyHabit.findMany({
      where: { userId },
      take: 10,
      orderBy: { date: 'desc' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EcoTrack-Report-${user.name || 'User'}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Styling Colors
    const primaryColor = '#10B981'; // Emerald Green
    const secondaryColor = '#065F46'; // Forest Green
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
    doc.text(`User Profile: ${user.name || 'N/A'}`);
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

      items.forEach((item) => {
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

    // Footer
    doc.fontSize(9).fillColor('#9CA3AF').text('Generated by EcoTrack AI. Understand your impact, reduce your footprint.', 50, 700, { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('PDF Report Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}

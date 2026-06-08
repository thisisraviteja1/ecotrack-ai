import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean old challenges
  await prisma.userChallenge.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.dailyHabit.deleteMany({});
  await prisma.calculation.deleteMany({});
  await prisma.receiptScan.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Challenges
  const challenges = [
    {
      title: 'No Plastic Week',
      description: 'Avoid all single-use plastics for 7 days. Track your progress daily and submit photos or receipts showing reusable alternatives.',
      points: 150,
      duration: 7,
      category: 'waste'
    },
    {
      title: 'Public Transport Challenge',
      description: 'Commute using only bus, train, metro, walking, or cycling for 5 consecutive work days to dramatically lower your emissions.',
      points: 200,
      duration: 5,
      category: 'transport'
    },
    {
      title: 'Plant a Tree Challenge',
      description: 'Plant a tree (or support a verified tree-planting initiative through our offset marketplace) and witness carbon offset growth.',
      points: 250,
      duration: 1,
      category: 'waste'
    },
    {
      title: 'Energy Saver Challenge',
      description: 'Reduce AC/heating runtime by 2 hours daily and turn off standby power for electronics. Save electricity and points!',
      points: 120,
      duration: 7,
      category: 'energy'
    },
    {
      title: 'Green Diet Weekend',
      description: 'Eat 100% vegetarian or vegan meals over the weekend. Livestock agriculture contributes heavily to global emissions.',
      points: 100,
      duration: 2,
      category: 'food'
    }
  ];

  for (const challenge of challenges) {
    await prisma.challenge.create({
      data: challenge
    });
  }

  // Seed Users for Leaderboard
  const users = [
    { email: 'sarah.eco@example.com', name: 'Sarah Jenkins', points: 1250, level: 'Climate Champion' },
    { email: 'alex.green@example.com', name: 'Alex Rivera', points: 920, level: 'Sustainability Hero' },
    { email: 'david.sustainable@example.com', name: 'David Chen', points: 740, level: 'Sustainability Hero' },
    { email: 'emily.nature@example.com', name: 'Emily Watson', points: 480, level: 'Eco Explorer' },
    { email: 'liam.earth@example.com', name: 'Liam Patel', points: 150, level: 'Beginner' }
  ];

  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: user
    });

    // Add calculations for seed users to populate dashboard graphs
    const totalCO2 = Math.random() * 300 + 150; // 150 - 450 kg CO2 / month
    await prisma.calculation.create({
      data: {
        userId: createdUser.id,
        transportMode: 'car',
        travelDistance: 15 + Math.random() * 20,
        electricity: 150 + Math.random() * 100,
        acUsage: 4 + Math.random() * 4,
        diet: 'mixed',
        shoppingOnline: 4,
        shoppingFashion: 2,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium',
        transportCO2: totalCO2 * 0.45,
        energyCO2: totalCO2 * 0.35,
        foodCO2: totalCO2 * 0.12,
        shoppingCO2: totalCO2 * 0.05,
        wasteCO2: totalCO2 * 0.03,
        totalCO2: totalCO2,
        carbonScore: Math.round(75 - (totalCO2 / 10)),
        rating: totalCO2 < 250 ? 'B' : totalCO2 < 350 ? 'C' : 'D'
      }
    });

    // Add daily habit entries for past few days
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      await prisma.dailyHabit.create({
        data: {
          userId: createdUser.id,
          date: date,
          usedBicycle: Math.random() > 0.5,
          avoidedPlastic: Math.random() > 0.3,
          usedPublicTransport: Math.random() > 0.4,
          savedElectricity: Math.random() > 0.2,
          recycledWaste: Math.random() > 0.3,
          carpooled: Math.random() > 0.6,
          pointsEarned: 20
        }
      });
    }
  }

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

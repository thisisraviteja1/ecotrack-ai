// EcoTrack AI Local Storage API Client
// Implements 100% client-side persistence, local AI Insight generation,
// and zero-config deployment without external server dependencies.

import { calculateCarbonMath, FootprintInputs, FootprintOutputs } from './carbonMath';

// Safe check for browser localStorage
const isBrowser = typeof window !== 'undefined';

function getStorageItem(key: string, defaultValue: any): any {
  if (!isBrowser) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

function setStorageItem(key: string, value: any): void {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ==========================================
// 1. DATABASE SEEDING (LOCAL)
// ==========================================
const DEFAULT_USERS = [
  { id: '1', email: 'sarah.eco@example.com', name: 'Sarah Jenkins', points: 1250, level: 'Climate Champion', role: 'USER' },
  { id: '2', email: 'alex.green@example.com', name: 'Alex Rivera', points: 920, level: 'Sustainability Hero', role: 'USER' },
  { id: '3', email: 'david.sustainable@example.com', name: 'David Chen', points: 740, level: 'Sustainability Hero', role: 'USER' },
  { id: '4', email: 'emily.nature@example.com', name: 'Emily Watson', points: 480, level: 'Eco Explorer', role: 'USER' },
  { id: '5', email: 'liam.earth@example.com', name: 'Liam Patel', points: 150, level: 'Beginner', role: 'USER' }
];

const DEFAULT_CHALLENGES = [
  {
    id: 'ch-1',
    title: 'No Plastic Week',
    description: 'Avoid all single-use plastics for 7 days. Track your progress daily and submit photos or receipts showing reusable alternatives.',
    points: 150,
    duration: 7,
    category: 'waste'
  },
  {
    id: 'ch-2',
    title: 'Public Transport Challenge',
    description: 'Commute using only bus, train, metro, walking, or cycling for 5 consecutive work days to dramatically lower your emissions.',
    points: 200,
    duration: 5,
    category: 'transport'
  },
  {
    id: 'ch-3',
    title: 'Plant a Tree Challenge',
    description: 'Plant a tree (or support a verified tree-planting initiative through our offset marketplace) and witness carbon offset growth.',
    points: 250,
    duration: 1,
    category: 'waste'
  },
  {
    id: 'ch-4',
    title: 'Energy Saver Challenge',
    description: 'Reduce AC/heating runtime by 2 hours daily and turn off standby power for electronics. Save electricity and points!',
    points: 120,
    duration: 7,
    category: 'energy'
  },
  {
    id: 'ch-5',
    title: 'Green Diet Weekend',
    description: 'Eat 100% vegetarian or vegan meals over the weekend. Livestock agriculture contributes heavily to global emissions.',
    points: 100,
    duration: 2,
    category: 'food'
  }
];

// Seed initial users into localStorage if they don't exist
if (isBrowser && !localStorage.getItem('ecotrack_users_list')) {
  localStorage.setItem('ecotrack_users_list', JSON.stringify(DEFAULT_USERS));
}

// Helpers to read/write mock users list
function getLocalUsers(): any[] {
  return getStorageItem('ecotrack_users_list', DEFAULT_USERS);
}

function saveLocalUsers(users: any[]): void {
  setStorageItem('ecotrack_users_list', users);
}

// ==========================================
// 2. AUTHENTICATION SERVICES
// ==========================================

export async function checkAuthStatus(): Promise<any | null> {
  return getStorageItem('ecotrack_user', null);
}

export async function login(credentials: { email: string; password?: string }) {
  const users = getLocalUsers();
  const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
  
  if (!user) {
    throw new Error('Invalid email or password credentials');
  }

  // Set current user session
  setStorageItem('ecotrack_user', user);
  window.dispatchEvent(new Event('ecotrack-user-updated'));
  return user;
}

export async function register(profile: { email: string; password?: string; name: string }) {
  const users = getLocalUsers();
  const exists = users.some(u => u.email.toLowerCase() === profile.email.toLowerCase());

  if (exists) {
    throw new Error('Email address is already registered');
  }

  const newUser = {
    id: `u-${Date.now()}`,
    email: profile.email.toLowerCase(),
    name: profile.name,
    points: 0,
    level: 'Beginner',
    role: 'USER'
  };

  users.push(newUser);
  saveLocalUsers(users);

  // Set current user session
  setStorageItem('ecotrack_user', newUser);
  window.dispatchEvent(new Event('ecotrack-user-updated'));
  return newUser;
}

export async function logout(): Promise<void> {
  if (isBrowser) {
    localStorage.removeItem('ecotrack_user');
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
}

// Helper to update active user's points & level
function updateUserStats(pointsEarned: number): any {
  const currentUser = getStorageItem('ecotrack_user', null);
  if (!currentUser) return null;

  currentUser.points += pointsEarned;

  // Level boundaries
  if (currentUser.points >= 1000) {
    currentUser.level = 'Climate Champion';
  } else if (currentUser.points >= 600) {
    currentUser.level = 'Sustainability Hero';
  } else if (currentUser.points >= 300) {
    currentUser.level = 'Eco Explorer';
  } else {
    currentUser.level = 'Beginner';
  }

  // Save to session
  setStorageItem('ecotrack_user', currentUser);

  // Save back to general users list
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    users[idx] = currentUser;
    saveLocalUsers(users);
  }

  window.dispatchEvent(new Event('ecotrack-user-updated'));
  return currentUser;
}

// ==========================================
// 3. CARBON FOOTPRINT TELEMETRY
// ==========================================

export async function getDashboardStats() {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  // Read calculation history
  const key = `ecotrack_calcs_${user.id}`;
  let history = getStorageItem(key, []);

  // If calculation history is empty, seed a default calculation so the dashboard renders beautifully
  if (history.length === 0) {
    const defaultInputs: FootprintInputs = {
      transportMode: 'bus',
      travelDistance: 15,
      electricity: 140,
      acUsage: 3,
      diet: 'mixed',
      shoppingOnline: 3,
      shoppingFashion: 1,
      recyclingHabit: 'sometimes',
      plasticUsage: 'medium'
    };
    const defaultOutputs = calculateCarbonMath(defaultInputs);
    const initialEntry = {
      id: `c-seed`,
      ...defaultInputs,
      ...defaultOutputs,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString() // 5 days ago
    };
    history = [initialEntry];
    setStorageItem(key, history);
  }

  const lastCalculation = history[history.length - 1];

  // Retrieve daily habit checks
  const habitsKey = `ecotrack_habits_${user.id}`;
  const habits = getStorageItem(habitsKey, []);

  // Format a weekly trends timeline for charting
  const weeklyTrend = history.map((calc: any, idx: number) => {
    const date = new Date(calc.createdAt);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      emissions: Math.round(calc.totalCO2),
      score: calc.carbonScore
    };
  });

  // Calculate reduction metrics compared to average
  const avgMonthlyCO2 = 400; // Average consumer emissions factor reference
  const currentMonthlyCO2 = lastCalculation ? lastCalculation.totalCO2 : 0;
  const reductionPercentage = lastCalculation
    ? Math.max(0, Math.min(100, Math.round(((avgMonthlyCO2 - currentMonthlyCO2) / avgMonthlyCO2) * 100)))
    : 0;

  // Retrieve active and completed challenges lists from localStorage
  const chKey = `ecotrack_challenges_${user.id}`;
  const userChallenges = getStorageItem(chKey, []);
  
  const activeChallenges = DEFAULT_CHALLENGES.filter(ch => 
    userChallenges.some((uc: any) => uc.challengeId === ch.id && uc.status === 'IN_PROGRESS')
  ).map(ch => {
    const uc = userChallenges.find((u: any) => u.challengeId === ch.id);
    return { ...ch, userChallenge: uc };
  });

  const completedChallenges = DEFAULT_CHALLENGES.filter(ch => 
    userChallenges.some((uc: any) => uc.challengeId === ch.id && uc.status === 'COMPLETED')
  ).map(ch => {
    const uc = userChallenges.find((u: any) => u.challengeId === ch.id);
    return { ...ch, userChallenge: uc };
  });

  return {
    points: user.points,
    level: user.level,
    lastCalculation,
    calculationHistory: history,
    habits,
    weeklyTrend,
    monthlyFootprint: currentMonthlyCO2,
    reductionPercentage,
    activeChallenges,
    completedChallenges
  };
}

export async function submitCalculation(data: any) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  const outputs = calculateCarbonMath(data as FootprintInputs);
  const entry = {
    id: `calc-${Date.now()}`,
    ...data,
    ...outputs,
    createdAt: new Date().toISOString()
  };

  const key = `ecotrack_calcs_${user.id}`;
  const history = getStorageItem(key, []);
  history.push(entry);
  setStorageItem(key, history);

  // Award XP points for tracking carbon
  const updatedUser = updateUserStats(50);

  return {
    success: true,
    calculation: entry,
    updatedUser
  };
}

// ==========================================
// 4. HABIT TRACKING (LOCAL PERSISTENCE)
// ==========================================

export async function submitHabits(habitsInput: any) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  // Count active checkboxes
  let activeHabitsCount = 0;
  if (habitsInput.usedBicycle) activeHabitsCount++;
  if (habitsInput.avoidedPlastic) activeHabitsCount++;
  if (habitsInput.usedPublicTransport) activeHabitsCount++;
  if (habitsInput.savedElectricity) activeHabitsCount++;
  if (habitsInput.recycledWaste) activeHabitsCount++;
  if (habitsInput.carpooled) activeHabitsCount++;

  const pointsAwarded = activeHabitsCount * 15; // +15 XP per habit action checked

  const entry = {
    id: `h-${Date.now()}`,
    date: new Date().toISOString(),
    ...habitsInput,
    pointsEarned: pointsAwarded
  };

  const key = `ecotrack_habits_${user.id}`;
  const history = getStorageItem(key, []);
  history.push(entry);
  setStorageItem(key, history);

  // Update user session stats
  const updatedUser = updateUserStats(pointsAwarded);

  return {
    success: true,
    user: updatedUser
  };
}

// ==========================================
// 5. GREEN CHALLENGES (LOCAL LOGIC)
// ==========================================

export async function getChallenges() {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  const key = `ecotrack_challenges_${user.id}`;
  const userChallenges = getStorageItem(key, []);

  // Map state
  return DEFAULT_CHALLENGES.map(ch => {
    const userCh = userChallenges.find((uCh: any) => uCh.challengeId === ch.id);
    return {
      ...ch,
      userChallenge: userCh || null
    };
  });
}

export async function joinChallenge(challengeId: string) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  const key = `ecotrack_challenges_${user.id}`;
  const userChallenges = getStorageItem(key, []);

  const exists = userChallenges.some((uCh: any) => uCh.challengeId === challengeId);
  if (!exists) {
    userChallenges.push({
      id: `uc-${Date.now()}`,
      challengeId,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      completedAt: null
    });
    setStorageItem(key, userChallenges);
  }

  return { success: true };
}

export async function claimChallengeReward(userChallengeId: string) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  const key = `ecotrack_challenges_${user.id}`;
  const userChallenges = getStorageItem(key, []);

  const idx = userChallenges.findIndex((uCh: any) => uCh.id === userChallengeId);
  if (idx !== -1 && userChallenges[idx].status === 'IN_PROGRESS') {
    userChallenges[idx].status = 'COMPLETED';
    userChallenges[idx].completedAt = new Date().toISOString();
    setStorageItem(key, userChallenges);

    // Find challenge points
    const challenge = DEFAULT_CHALLENGES.find(c => c.id === userChallenges[idx].challengeId);
    const rewardPoints = challenge ? challenge.points : 100;

    const updatedUser = updateUserStats(rewardPoints);
    return {
      success: true,
      user: updatedUser
    };
  }

  throw new Error('Reward already claimed or invalid challenge ID');
}

// ==========================================
// 6. COMMUNITY LEADERBOARD (MOCK INTEGRATION)
// ==========================================

export async function getLeaderboard() {
  const user = await checkAuthStatus();
  const users = getLocalUsers();

  // Sort by points descending
  const sorted = [...users].sort((a, b) => b.points - a.points);
  
  // Return top 10 mapped users
  return sorted.slice(0, 10).map(u => ({
    id: u.id,
    name: u.name,
    points: u.points,
    level: u.level,
    email: u.email
  }));
}

// ==========================================
// 7. GREEN MARKETPLACE (MOCK REDEMPTIONS)
// ==========================================

export async function buyOffset(cost: number, name: string) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  if (user.points < cost) {
    throw new Error('Insufficient XP points to purchase this offset project.');
  }

  // Deduct cost
  const updatedUser = updateUserStats(-cost);

  // Record transaction
  const txKey = `ecotrack_tx_${user.id}`;
  const txList = getStorageItem(txKey, []);
  txList.push({
    id: `tx-${Date.now()}`,
    name,
    cost,
    date: new Date().toISOString()
  });
  setStorageItem(txKey, txList);

  return {
    success: true,
    user: updatedUser
  };
}

// ==========================================
// 8. AI INSIGHT GENERATOR (LOCAL EXPERT BUSINESS LOGIC)
// ==========================================

export async function askCoach(history: any[], message: string) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  const stats = await getDashboardStats();
  const lastCalc = stats.lastCalculation;
  
  const msgLower = message.toLowerCase();
  let aiResponse = '';

  if (msgLower.includes('transport') || /\bcar\b/.test(msgLower) || msgLower.includes('travel') || msgLower.includes('flight')) {
    const transportCO2 = lastCalc ? Math.round(lastCalc.transportCO2) : 120;
    aiResponse = `Regarding transportation, your monthly transport emission is **${transportCO2} kg CO2**. 
    
Here are custom steps based on your profile:
1. **Reduce Short Trips**: Commuting to work or shops using a bicycle or walking saves up to 100% of fuel emissions.
2. **Embrace Trains/Bus Transit**: Public transport emits 60-80% less CO2 per passenger mile compared to solo driving.
3. **Optimise Highway Driving**: Driving at 55 mph instead of 75 mph improves fuel economy by about 15%.`;
  } 
  
  else if (msgLower.includes('energy') || msgLower.includes('electricity') || /\bac\b/.test(msgLower) || msgLower.includes('power')) {
    const energyCO2 = lastCalc ? Math.round(lastCalc.energyCO2) : 100;
    aiResponse = `For energy conservation, your current monthly energy emission is **${energyCO2} kg CO2**.

Recommended actions:
1. **Thermostat Regulation**: Setting your AC temperature to 25°C (77°F) instead of lower levels reduces compressor workload, saving up to 18% electricity.
2. **Standby Losses**: Turn off multi-plug adapters and electronics at the wall. Standby power accounts for 5-10% of household electric bills.
3. **Upgrade to LEDs**: Replace old halogen bulbs with Energy Star LEDs. They use 75% less energy and last 25 times longer.`;
  }

  else if (msgLower.includes('food') || msgLower.includes('diet') || msgLower.includes('vegetarian') || msgLower.includes('meat')) {
    aiResponse = `Regarding food choices, you currently report a **${lastCalc ? lastCalc.diet : 'mixed'}** diet.

Dietary carbon tips:
1. **Meat-Free Mondays**: Cutting out red meat just one day a week saves roughly 300 kg of CO2 emissions annually per person.
2. **Zero Waste Cooking**: Planning meals, storing vegetables in sealed drawers, and composting scraps prevents organic landfill rot which releases methane.
3. **Buy Locally**: Sourcing seasonal farm food reduces the carbon miles spent on heavy long-haul refrigeration transport.`;
  }

  else if (msgLower.includes('plastic') || msgLower.includes('waste') || msgLower.includes('recycle')) {
    aiResponse = `For waste management, you report a plastic usage level of **${lastCalc ? lastCalc.plasticUsage : 'medium'}**.

Reducing plastic waste:
1. **Ditch Reusables**: Replace single-use PET water bottles with stainless steel containers. It eliminates oil-extraction manufacturing emissions.
2. **Review Recycling Rules**: Clean aluminum cans, glass, and dry cardboard before recycling. Contaminated items often end up in landfills.
3. **Avoid Fast Packaging**: Choose products sold in bulk or wrapped in paper rather than multi-layered plastics.`;
  }

  else {
    // Default response: analyze user's highest emission category
    let topCategory = 'Energy Usage';
    let highestEmissions = lastCalc ? lastCalc.energyCO2 : 100;

    if (lastCalc) {
      if (lastCalc.transportCO2 > highestEmissions) {
        topCategory = 'Transportation';
        highestEmissions = lastCalc.transportCO2;
      }
      if (lastCalc.foodCO2 > highestEmissions) {
        topCategory = 'Food Habits';
        highestEmissions = lastCalc.foodCO2;
      }
      if (lastCalc.shoppingCO2 > highestEmissions) {
        topCategory = 'Shopping Habits';
        highestEmissions = lastCalc.shoppingCO2;
      }
    }

    aiResponse = `Hello! I am your local Gemini Sustainability Coach. Based on your carbon footprint calculation, your largest emission driver is **${topCategory}** (representing **${Math.round(highestEmissions)} kg CO2**).

Here is your **Quick Carbon Mitigation Plan**:
- **Action 1**: Switch off standby power adapters and turn up the AC thermostat by 1-2 degrees.
- **Action 2**: Replace 2 car trips per week with walking or cycling.
- **Action 3**: Avoid fast-fashion shopping and opt for verified green packaging alternatives.

What specific area would you like to discuss today? (e.g. "transportation tips", "energy saving", "diet choices")`;
  }

  return {
    reply: aiResponse,
    timestamp: new Date().toISOString()
  };
}

// ==========================================
// 9. AI BILL SCANNING (SIMULATED RECEIPT ANALYSIS)
// ==========================================

export async function scanReceipt(file: File) {
  const user = await checkAuthStatus();
  if (!user) throw new Error('Unauthorized');

  // Generate realistic CO2 data based on mock scan
  const nameLower = file.name.toLowerCase();
  let category = 'retail';
  let co2Estimate = 12.5;

  if (nameLower.includes('bill') || nameLower.includes('electric') || nameLower.includes('utility')) {
    category = 'electricity';
    co2Estimate = 75.0;
  } else if (nameLower.includes('fuel') || nameLower.includes('gas') || nameLower.includes('uber')) {
    category = 'transport';
    co2Estimate = 45.0;
  } else if (nameLower.includes('food') || nameLower.includes('grocery') || nameLower.includes('uber-eats')) {
    category = 'food';
    co2Estimate = 18.0;
  }

  // Award XP points for receipt audit scans
  const updatedUser = updateUserStats(40);

  return {
    success: true,
    scan: {
      id: `s-${Date.now()}`,
      fileName: file.name,
      fileType: file.type || 'image/png'
    },
    result: {
      amount: 85.5,
      co2Estimate
    },
    rawText: `EcoTrack Receipt Scanner Mock\n========================\nFile: ${file.name}\nSize: ${file.size} bytes\nCO2 Carbon Index: ${co2Estimate} kg\n========================`,
    user: updatedUser
  };
}

// ==========================================
// 10. CLIENT-SIDE DOWNLOADABLE REPORTS
// ==========================================

export function getPdfReportUrl(): string {
  // Returns a client-side javascript protocol to trigger browser printing or report build
  return 'javascript:window.print()';
}

/**
 * Downloads a complete Carbon Footprint Report as a formatted markdown/text file client-side.
 */
export async function downloadTextReport(): Promise<void> {
  const user = await checkAuthStatus();
  if (!user) return;

  const stats = await getDashboardStats();
  const lastCalc = stats.lastCalculation;

  const content = `=====================================================
            ECOTRACK AI CARBON FOOTPRINT REPORT          
=====================================================
User Profile: ${user.name}
Level: ${user.level}
XP Points: ${user.points} XP
Date Generated: ${new Date().toLocaleDateString()}

-----------------------------------------------------
1. CARBON FOOTPRINT ANALYSIS SUMMARY
-----------------------------------------------------
Monthly Total Carbon Footprint: ${lastCalc ? Math.round(lastCalc.totalCO2) : 0} kg CO2
Sustainability Score: ${lastCalc ? lastCalc.carbonScore : 0}/100
Rating Grade: ${lastCalc ? lastCalc.rating : 'N/A'}

Category Breakdown (Monthly Emissions):
- Transportation: ${lastCalc ? Math.round(lastCalc.transportCO2) : 0} kg CO2
- Household Energy: ${lastCalc ? Math.round(lastCalc.energyCO2) : 0} kg CO2
- Diet & Food: ${lastCalc ? Math.round(lastCalc.foodCO2) : 0} kg CO2
- Shopping Habits: ${lastCalc ? Math.round(lastCalc.shoppingCO2) : 0} kg CO2
- Plastic & Waste: ${lastCalc ? Math.round(lastCalc.wasteCO2) : 0} kg CO2

-----------------------------------------------------
2. DAILY HABITS ACTIVITY SUMMARY
-----------------------------------------------------
Logged green actions count: ${stats.habits ? stats.habits.length : 0}
Last daily checked activity logged: ${stats.habits && stats.habits.length > 0 ? new Date(stats.habits[stats.habits.length - 1].date).toLocaleDateString() : 'None'}

-----------------------------------------------------
3. PERSONALIZED SUSTAINABILITY RECOMMENDATIONS
-----------------------------------------------------
- Transportation: Commute using public transport or cycling to save up to 80% on travel emissions.
- Household Energy: Turn up the AC thermostat by 1-2 degrees and switch off wall power strips to reduce standby drain.
- Diet: Integrate red meat substitutes (Meatless Mondays) to cut food footprint by 15-20%.
- Waste: Clean containers before recycling and substitute PET containers with steel reusable bottles.

=====================================================
          Thank you for tracking with EcoTrack AI!   
=====================================================`;

  // Create downloadable file blob
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EcoTrack_Carbon_Report_${user.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

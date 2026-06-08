// EcoTrack AI API Client helper

const API_BASE = 'http://localhost:5001/api';

/**
 * Gets or creates the current user session from local storage.
 * If no user exists, it registers a default demo user.
 */
export async function getOrCreateUserSession(): Promise<{ id: string; email: string; name: string; points: number; level: string }> {
  if (typeof window === 'undefined') {
    return { id: '', email: '', name: '', points: 0, level: 'Beginner' };
  }

  const storedUser = localStorage.getItem('ecotrack_user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      // Fetch latest points/level status from backend
      const res = await fetch(`${API_BASE}/dashboard/${parsed.id}`).then(r => r.json());
      if (res && res.user) {
        const updatedUser = res.user;
        localStorage.setItem('ecotrack_user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse stored user, creating new session', e);
    }
  }

  // Create a default session
  const randomId = Math.floor(Math.random() * 100000);
  const demoEmail = `eco.hero.${randomId}@ecotrack.ai`;
  const demoName = `Eco Explorer #${randomId}`;

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, name: demoName })
    });

    if (!response.ok) {
      throw new Error('Server registration failed');
    }

    const user = await response.json();
    localStorage.setItem('ecotrack_user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('API Auth fallback to mock session:', error);
    // Mock user for offline mode
    const mockUser = {
      id: 'mock-user-12345',
      email: demoEmail,
      name: demoName,
      points: 120,
      level: 'Eco Explorer'
    };
    localStorage.setItem('ecotrack_user', JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Get dashboard stats for a user
 */
export async function getDashboardStats(userId: string) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return await response.json();
  } catch (error) {
    console.error('Fetch dashboard stats error, returning mock data:', error);
    return getMockDashboardData();
  }
}

/**
 * Submit carbon calculation parameters
 */
export async function submitCalculation(data: {
  userId: string;
  transportMode: string;
  travelDistance: number;
  electricity: number;
  acUsage: number;
  diet: string;
  shoppingOnline: number;
  shoppingFashion: number;
  recyclingHabit: string;
  plasticUsage: string;
}) {
  const response = await fetch(`${API_BASE}/calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Calculation submission failed');
  const result = await response.json();
  
  // Update local session points
  if (result.updatedUser) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.updatedUser));
  }
  return result;
}

/**
 * Update daily habits tracker checklist
 */
export async function submitHabits(userId: string, habits: {
  usedBicycle: boolean;
  avoidedPlastic: boolean;
  usedPublicTransport: boolean;
  savedElectricity: boolean;
  recycledWaste: boolean;
  carpooled: boolean;
}) {
  const response = await fetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, habits })
  });
  if (!response.ok) throw new Error('Habit submission failed');
  const result = await response.json();
  
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
  }
  return result;
}

/**
 * Get community leaderboard rank list
 */
export async function getLeaderboard() {
  try {
    const response = await fetch(`${API_BASE}/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  } catch (e) {
    return [
      { name: 'Sarah Jenkins', points: 1250, level: 'Climate Champion' },
      { name: 'Alex Rivera', points: 920, level: 'Sustainability Hero' },
      { name: 'David Chen', points: 740, level: 'Sustainability Hero' },
      { name: 'Emily Watson', points: 480, level: 'Eco Explorer' },
      { name: 'Liam Patel', points: 150, level: 'Beginner' }
    ];
  }
}

/**
 * Fetch available Challenges
 */
export async function getChallenges() {
  try {
    const response = await fetch(`${API_BASE}/challenges`);
    if (!response.ok) throw new Error('Failed to fetch challenges');
    return await response.json();
  } catch (e) {
    return [
      { id: '1', title: 'No Plastic Week', description: 'Avoid single-use plastics for 7 days.', points: 150, category: 'waste' },
      { id: '2', title: 'Public Transport Challenge', description: 'Commute using only public transit for 5 days.', points: 200, category: 'transport' },
      { id: '3', title: 'Plant a Tree Challenge', description: 'Plant a tree or purchase a sapling.', points: 250, category: 'waste' },
      { id: '4', title: 'Energy Saver Challenge', description: 'Save AC runtime by 2 hours daily.', points: 120, category: 'energy' }
    ];
  }
}

/**
 * Join a green challenge
 */
export async function joinChallenge(userId: string, challengeId: string) {
  const response = await fetch(`${API_BASE}/challenges/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, challengeId })
  });
  if (!response.ok) throw new Error('Failed to join challenge');
  return await response.json();
}

/**
 * Complete and claim challenge reward points
 */
export async function claimChallengeReward(userChallengeId: string) {
  const response = await fetch(`${API_BASE}/challenges/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userChallengeId })
  });
  if (!response.ok) throw new Error('Failed to claim reward');
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
  }
  return result;
}

/**
 * Send request to Gemini AI Sustainability Coach
 */
export async function askCoach(history: any[], message: string) {
  const response = await fetch(`${API_BASE}/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message })
  });
  if (!response.ok) throw new Error('Coach query failed');
  return await response.json();
}

/**
 * Upload bill/receipt image to backend AI Receipt Scanner
 */
export async function scanReceipt(userId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await fetch(`${API_BASE}/ai/scan-receipt`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Receipt scanning failed');
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
  }
  return result;
}

/**
 * Spend Eco Points in Marketplace
 */
export async function buyOffset(userId: string, cost: number, name: string) {
  const response = await fetch(`${API_BASE}/offset/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, cost, name })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Offset transaction failed');
  }
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
  }
  return result;
}

/**
 * Get PDF Report download URL
 */
export function getPdfReportUrl(userId: string): string {
  return `${API_BASE}/reports/pdf/${userId}`;
}

// Helper mock data
function getMockDashboardData() {
  return {
    latestCalculation: {
      transportCO2: 120.5,
      energyCO2: 85.2,
      foodCO2: 150.0,
      shoppingCO2: 30.0,
      wasteCO2: 12.0,
      totalCO2: 397.7,
      carbonScore: 47,
      rating: 'D'
    },
    habits: [
      { date: new Date().toISOString(), usedBicycle: true, avoidedPlastic: false, usedPublicTransport: true, savedElectricity: false, recycledWaste: true, carpooled: false }
    ],
    activeChallenges: [],
    completedChallenges: [],
    prediction: {
      forecastAnnualWithoutChange: 4772,
      forecastAnnualWithChange: 3579,
      reductionPercent: 25,
      explanation: "Mock mode is active. Keep logging your daily habits to decrease your carbon footprint prediction."
    },
    reductionPercentage: 25
  };
}

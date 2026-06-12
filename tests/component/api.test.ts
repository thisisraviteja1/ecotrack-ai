import {
  checkAuthStatus,
  login,
  register,
  logout,
  getDashboardStats,
  submitCalculation,
  submitHabits,
  getChallenges,
  joinChallenge,
  claimChallengeReward,
  getLeaderboard,
  buyOffset,
  askCoach,
  scanReceipt,
  getPdfReportUrl,
  downloadTextReport
} from '../../src/lib/api';

describe('Local Storage API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize lists
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  });

  it('handles user registration and active sessions', async () => {
    // Check initial session is null
    const initialSession = await checkAuthStatus();
    expect(initialSession).toBeNull();

    // Register a new user
    const newUser = await register({
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123!'
    });

    expect(newUser.email).toBe('test@example.com');
    expect(newUser.name).toBe('Test User');
    expect(newUser.points).toBe(0);

    // Verify auth status returns the new user
    const activeUser = await checkAuthStatus();
    expect(activeUser).not.toBeNull();
    expect(activeUser.email).toBe('test@example.com');

    // Trying to register the same email fails
    await expect(register({
      email: 'test@example.com',
      name: 'Another Name',
      password: 'Password123!'
    })).rejects.toThrow('Email address is already registered');
  });

  it('handles user login and logout', async () => {
    // Register
    await register({
      email: 'login@example.com',
      name: 'Login User',
      password: 'Password123!'
    });

    // Logout
    await logout();
    let activeUser = await checkAuthStatus();
    expect(activeUser).toBeNull();

    // Login
    const loggedInUser = await login({ email: 'login@example.com' });
    expect(loggedInUser.name).toBe('Login User');

    activeUser = await checkAuthStatus();
    expect(activeUser).not.toBeNull();
    expect(activeUser.email).toBe('login@example.com');

    // Login with invalid email fails
    await expect(login({ email: 'nonexistent@example.com' })).rejects.toThrow('Invalid email or password credentials');
  });

  it('calculates carbon footprint and fetches dashboard stats', async () => {
    await register({
      email: 'calc@example.com',
      name: 'Calc User',
      password: 'Password123!'
    });

    // Retrieve stats (automatically seeds a default calculation if history is empty)
    const stats = await getDashboardStats();
    expect(stats.points).toBe(0);
    expect(stats.weeklyTrend.length).toBe(1);
    expect(stats.monthlyFootprint).toBeGreaterThan(0);

    // Submit a custom calculation
    const calcResult = await submitCalculation({
      transportMode: 'car',
      travelDistance: 20,
      electricity: 150,
      acUsage: 4,
      diet: 'vegetarian',
      shoppingOnline: 2,
      shoppingFashion: 0,
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });

    expect(calcResult.success).toBe(true);
    expect(calcResult.calculation.transportCO2).toBe(108); // 20 * 30 * 0.18
    expect(calcResult.updatedUser.points).toBe(50); // XP awarded for calculation

    // Check dashboard statistics update
    const updatedStats = await getDashboardStats();
    expect(updatedStats.points).toBe(50);
    expect(updatedStats.calculationHistory.length).toBe(2); // seeded + new
    expect(updatedStats.lastCalculation.diet).toBe('vegetarian');
  });

  it('submits daily habits and earns XP', async () => {
    await register({
      email: 'habits@example.com',
      name: 'Habit User',
      password: 'Password123!'
    });

    const result = await submitHabits({
      usedBicycle: true,
      avoidedPlastic: true,
      usedPublicTransport: false,
      savedElectricity: true,
      recycledWaste: false,
      carpooled: false
    });

    expect(result.success).toBe(true);
    expect(result.user.points).toBe(45); // 3 habits * 15 XP each = 45 XP
  });

  it('manages challenges and rewards', async () => {
    await register({
      email: 'challenges@example.com',
      name: 'Challenge User',
      password: 'Password123!'
    });

    const list = await getChallenges();
    expect(list.length).toBeGreaterThan(0);

    // Join a challenge
    const firstChallenge = list[0];
    const joinRes = await joinChallenge(firstChallenge.id);
    expect(joinRes.success).toBe(true);

    // Get stats to see active challenges
    const stats = await getDashboardStats();
    expect(stats.activeChallenges.length).toBe(1);
    expect(stats.activeChallenges[0].title).toBe(firstChallenge.title);

    // Claim reward
    const userChallengeId = stats.activeChallenges[0].userChallenge.id;
    const claimRes = await claimChallengeReward(userChallengeId);
    expect(claimRes.success).toBe(true);
    expect(claimRes.user.points).toBe(firstChallenge.points);

    // Try claiming same reward again fails
    await expect(claimChallengeReward(userChallengeId)).rejects.toThrow('Reward already claimed or invalid challenge ID');
  });

  it('fetches community leaderboard', async () => {
    await register({
      email: 'leader@example.com',
      name: 'Leader User',
      password: 'Password123!'
    });

    const board = await getLeaderboard();
    expect(board.length).toBeGreaterThan(0);
    expect(board[0]).toHaveProperty('points');
  });

  it('processes green marketplace offset purchases', async () => {
    const user = await register({
      email: 'offset@example.com',
      name: 'Offset User',
      password: 'Password123!'
    });

    // Insufficient points at start (0 XP)
    await expect(buyOffset(100, 'Plant a Tree')).rejects.toThrow('Insufficient XP points');

    // Give points to user in localstorage
    user.points = 200;
    localStorage.setItem('ecotrack_user', JSON.stringify(user));

    const result = await buyOffset(80, 'Clean Oceans Project');
    expect(result.success).toBe(true);
    expect(result.user.points).toBe(120); // 200 - 80
  });

  it('runs local AI Coach chatbot logic', async () => {
    await register({
      email: 'coach@example.com',
      name: 'Coach User',
      password: 'Password123!'
    });

    // Test different prompts
    const res1 = await askCoach([], 'how to save energy?');
    expect(res1.reply).toContain('energy');

    const res2 = await askCoach([], 'give me transport tips');
    expect(res2.reply).toContain('transportation');

    const res3 = await askCoach([], 'tell me about diet and food');
    expect(res3.reply).toContain('food');

    const res4 = await askCoach([], 'what about plastic and waste?');
    expect(res4.reply).toContain('plastic');

    const defaultRes = await askCoach([], 'hello coach');
    expect(defaultRes.reply).toContain('Sustainability Coach');
  });

  it('scans mock receipts of different categories', async () => {
    await register({
      email: 'receipts@example.com',
      name: 'Receipt User',
      password: 'Password123!'
    });

    // 1. Utility Bill -> Electricity
    const file1 = new File(['mock content'], 'utility_bill.png', { type: 'image/png' });
    const res1 = await scanReceipt(file1);
    expect(res1.result.co2Estimate).toBe(75.0);

    // 2. Fuel Receipt -> Transport
    const file2 = new File(['mock content'], 'fuel.png', { type: 'image/png' });
    const res2 = await scanReceipt(file2);
    expect(res2.result.co2Estimate).toBe(45.0);

    // 3. Food Receipt -> Food
    const file3 = new File(['mock content'], 'grocery.png', { type: 'image/png' });
    const res3 = await scanReceipt(file3);
    expect(res3.result.co2Estimate).toBe(18.0);
  });

  it('correctly scales user levels and ranks based on points', async () => {
    const user = await register({
      email: 'level@example.com',
      name: 'Level User',
      password: 'Password123!'
    });

    // Directly alter points and submit habits to trigger level boundaries
    user.points = 290;
    localStorage.setItem('ecotrack_user', JSON.stringify(user));
    const res1 = await submitHabits({ usedBicycle: true }); // +15 XP -> 305 XP
    expect(res1.user.level).toBe('Eco Explorer');

    user.points = 590;
    localStorage.setItem('ecotrack_user', JSON.stringify(user));
    const res2 = await submitHabits({ usedBicycle: true }); // +15 XP -> 605 XP
    expect(res2.user.level).toBe('Sustainability Hero');

    user.points = 990;
    localStorage.setItem('ecotrack_user', JSON.stringify(user));
    const res3 = await submitHabits({ usedBicycle: true }); // +15 XP -> 1005 XP
    expect(res3.user.level).toBe('Climate Champion');
  });

  it('analyzes highest emission category in default coach fallback', async () => {
    await register({
      email: 'coach-fallback@example.com',
      name: 'Coach Fallback User',
      password: 'Password123!'
    });

    // 1. Transport highest
    await submitCalculation({
      transportMode: 'flight',
      travelDistance: 100, // huge transport emissions
      electricity: 10,
      acUsage: 0,
      diet: 'vegetarian',
      shoppingOnline: 0,
      shoppingFashion: 0,
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });
    const res1 = await askCoach([], 'hello');
    expect(res1.reply).toContain('Transportation');

    // 2. Shopping highest
    await submitCalculation({
      transportMode: 'walking',
      travelDistance: 0,
      electricity: 10,
      acUsage: 0,
      diet: 'vegetarian',
      shoppingOnline: 10,
      shoppingFashion: 10, // huge shopping emissions
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });
    const res2 = await askCoach([], 'hello');
    expect(res2.reply).toContain('Shopping Habits');
  });


  it('provides print URL and generates markdown download file', async () => {
    await register({
      email: 'report@example.com',
      name: 'Report User',
      password: 'Password123!'
    });

    const printUrl = getPdfReportUrl();
    expect(printUrl).toBe('javascript:window.print()');

    // Mock document.createElement & click to test downloadTextReport
    const spyElement = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    
    const spyCreate = jest.spyOn(document, 'createElement').mockReturnValue(spyElement as any);
    const spyAppend = jest.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
    const spyRemove = jest.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));
    
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn().mockReturnValue('mock-blob-url');
    URL.revokeObjectURL = jest.fn();

    await downloadTextReport();

    expect(spyCreate).toHaveBeenCalledWith('a');
    expect(spyElement.download).toContain('EcoTrack_Carbon_Report');
    expect(spyElement.click).toHaveBeenCalled();

    spyCreate.mockRestore();
    spyAppend.mockRestore();
    spyRemove.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

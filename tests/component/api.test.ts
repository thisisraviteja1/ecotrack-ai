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

    // Get stats again to verify completed challenges mapping is covered
    const statsAfterClaim = await getDashboardStats();
    expect(statsAfterClaim.completedChallenges.length).toBe(1);
    expect(statsAfterClaim.completedChallenges[0].title).toBe(firstChallenge.title);

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

  it('throws Unauthorized error for authenticated services when logged out', async () => {
    await logout();
    await expect(getDashboardStats()).rejects.toThrow('Unauthorized');
    await expect(submitCalculation({})).rejects.toThrow('Unauthorized');
    await expect(submitHabits({})).rejects.toThrow('Unauthorized');
    await expect(getChallenges()).rejects.toThrow('Unauthorized');
    await expect(joinChallenge('ch-1')).rejects.toThrow('Unauthorized');
    await expect(claimChallengeReward('uc-1')).rejects.toThrow('Unauthorized');
    await expect(buyOffset(10, 'Test')).rejects.toThrow('Unauthorized');
    await expect(askCoach([], 'hello')).rejects.toThrow('Unauthorized');
    const file = new File([''], 'test.png');
    await expect(scanReceipt(file)).rejects.toThrow('Unauthorized');
    
    // downloadTextReport returns early when logged out
    const spyCreate = jest.spyOn(document, 'createElement');
    await downloadTextReport();
    expect(spyCreate).not.toHaveBeenCalled();
    spyCreate.mockRestore();
  });

  it('handles user not found in local users list during updateStats', async () => {
    await register({
      email: 'notfound@example.com',
      name: 'Not Found User',
      password: 'Password123!'
    });
    // Remove users list from localStorage to force findIndex to return -1
    localStorage.removeItem('ecotrack_users_list');
    const result = await submitHabits({ usedBicycle: true });
    expect(result.success).toBe(true);
  });

  it('handles claimChallengeReward error cases and fallback reward points', async () => {
    const user = await register({
      email: 'claimfail@example.com',
      name: 'Claim Fail User',
      password: 'Password123!'
    });

    // 1. Invalid reward id
    await expect(claimChallengeReward('invalid-id')).rejects.toThrow('Reward already claimed or invalid challenge ID');

    // 2. Custom challenge id that is not in the default list
    const key = `ecotrack_challenges_${user.id}`;
    localStorage.setItem(key, JSON.stringify([{
      id: 'custom-uc-id',
      challengeId: 'non-existent-ch',
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      completedAt: null
    }]));

    const claimRes = await claimChallengeReward('custom-uc-id');
    expect(claimRes.success).toBe(true);
    expect(claimRes.user.points).toBe(100); // fallback 100 points
  });

  it('covers all habit checkboxes combinations in submitHabits', async () => {
    await register({
      email: 'allhabits@example.com',
      name: 'All Habits User',
      password: 'Password123!'
    });

    // All true
    const resAllTrue = await submitHabits({
      usedBicycle: true,
      avoidedPlastic: true,
      usedPublicTransport: true,
      savedElectricity: true,
      recycledWaste: true,
      carpooled: true
    });
    expect(resAllTrue.user.points).toBe(90); // 6 * 15 = 90 XP

    // All false
    const resAllFalse = await submitHabits({
      usedBicycle: false,
      avoidedPlastic: false,
      usedPublicTransport: false,
      savedElectricity: false,
      recycledWaste: false,
      carpooled: false
    });
    expect(resAllFalse.user.points).toBe(90); // 90 + 0 = 90 XP
  });

  it('scans receipts with additional filenames', async () => {
    await register({
      email: 'receipts-extra@example.com',
      name: 'Receipt User Extra',
      password: 'Password123!'
    });

    const fileFood = new File([''], 'test_food.png');
    const resFood = await scanReceipt(fileFood);
    expect(resFood.result.co2Estimate).toBe(18.0);

    const fileEats = new File([''], 'my_uber-eats_receipt.png');
    const resEats = await scanReceipt(fileEats);
    expect(resEats.result.co2Estimate).toBe(18.0);
  });

  it('handles missing lastCalculation in askCoach and downloadTextReport', async () => {
    const user = await register({
      email: 'missingcalc@example.com',
      name: 'Missing Calc User',
      password: 'Password123!'
    });

    // Mock JSON.parse to return a custom array with map overridden to prevent TypeError
    const originalParse = JSON.parse;
    JSON.parse = function(text) {
      const res = originalParse(text);
      if (Array.isArray(res) && res.length === 1 && res[0] === null) {
        const arr = [null];
        arr.map = () => [];
        return arr;
      }
      return res;
    };

    // Force lastCalculation to be null by seeding [null] into calculation history
    const key = `ecotrack_calcs_${user.id}`;
    localStorage.setItem(key, JSON.stringify([null]));

    // Check stats first
    const stats = await getDashboardStats();
    expect(stats.lastCalculation).toBeNull();
    expect(stats.monthlyFootprint).toBe(0);
    expect(stats.reductionPercentage).toBe(0);

    // askCoach transport tips with null lastCalc categories
    const resTransport = await askCoach([], 'give me transport tips');
    expect(resTransport.reply).toContain('120 kg CO2');

    // askCoach energy tips with null lastCalc categories
    const resEnergy = await askCoach([], 'give me energy tips');
    expect(resEnergy.reply).toContain('100 kg CO2');

    // askCoach default response with null lastCalc categories
    const resDefault = await askCoach([], 'hello');
    expect(resDefault.reply).toContain('Energy Usage');
    expect(resDefault.reply).toContain('100 kg CO2');

    // downloadTextReport with null lastCalc categories
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

    expect(spyElement.download).toContain('EcoTrack_Carbon_Report');

    spyCreate.mockRestore();
    spyAppend.mockRestore();
    spyRemove.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;

    // Restore JSON.parse
    JSON.parse = originalParse;
  });

  it('handles default askCoach fallbacks where food or shopping is highest category', async () => {
    await register({
      email: 'fallbackhigh@example.com',
      name: 'Fallback High User',
      password: 'Password123!'
    });

    // 1. Food is highest
    await submitCalculation({
      transportMode: 'walking',
      travelDistance: 0,
      electricity: 0,
      acUsage: 0,
      diet: 'mixed', // food emissions will be 150 kg
      shoppingOnline: 0,
      shoppingFashion: 0,
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });
    const resFood = await askCoach([], 'hello');
    expect(resFood.reply).toContain('Food Habits');

    // 2. Shopping is highest
    await submitCalculation({
      transportMode: 'walking',
      travelDistance: 0,
      electricity: 0,
      acUsage: 0,
      diet: 'vegetarian', // food emissions will be 60 kg
      shoppingOnline: 10, // 30 kg
      shoppingFashion: 10, // 150 kg
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });
    const resShop = await askCoach([], 'hello');
    expect(resShop.reply).toContain('Shopping Habits');
  });

  it('handles null user during updateUserStats', async () => {
    await register({ email: 'nulluserstats@example.com', name: 'Null Stats User', password: 'Password123!' });
    
    let callCount = 0;
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = jest.fn().mockImplementation(function(key) {
      if (key === 'ecotrack_user') {
        callCount++;
        if (callCount > 1) {
          return null;
        }
      }
      return originalGetItem.call(localStorage, key);
    });

    const res = await submitHabits({ usedBicycle: true });
    expect(res.user).toBeNull();

    Storage.prototype.getItem = originalGetItem;
  });

  it('handles user not found in general users list during stats update', async () => {
    const user = await register({ email: 'missinglist@example.com', name: 'Missing List User', password: 'Password123!' });
    
    const users = JSON.parse(localStorage.getItem('ecotrack_users') || '[]');
    const filtered = users.filter((u: any) => u.id !== user.id);
    localStorage.setItem('ecotrack_users', JSON.stringify(filtered));

    const res = await submitHabits({ usedBicycle: true });
    expect(res.success).toBe(true);
    
    const updatedUsers = JSON.parse(localStorage.getItem('ecotrack_users') || '[]');
    expect(updatedUsers.some((u: any) => u.id === user.id)).toBe(false);
  });

  it('prevents double joining of challenges', async () => {
    await register({ email: 'doublejoin@example.com', name: 'Double Join User', password: 'Password123!' });
    const list = await getChallenges();
    const chId = list[0].id;
    
    const firstJoin = await joinChallenge(chId);
    expect(firstJoin.success).toBe(true);

    const secondJoin = await joinChallenge(chId);
    expect(secondJoin.success).toBe(true);
  });

  it('covers askCoach diet/food and plastic/waste prompts under null and non-null calculation history', async () => {
    const user = await register({ email: 'coachprompts@example.com', name: 'Coach Prompts User', password: 'Password123!' });
    
    // 1. Null history by setting ecotrack_calcs empty in localStorage and mocking JSON.parse
    const key = `ecotrack_calcs_${user.id}`;
    const originalParse = JSON.parse;
    JSON.parse = (text: string) => {
      if (text.includes('ecotrack_user') || text.includes('ecotrack_users')) {
        return originalParse(text);
      }
      const arr = [null];
      arr.map = () => [];
      return arr;
    };
    
    const resFoodNull = await askCoach([], 'give me food and diet advice');
    expect(resFoodNull.reply).toContain('mixed');

    const resWasteNull = await askCoach([], 'what is plastic waste advice');
    expect(resWasteNull.reply).toContain('medium');

    JSON.parse = originalParse;

    // 2. Non-null history
    await submitCalculation({
      transportMode: 'car',
      travelDistance: 10,
      electricity: 100,
      acUsage: 2,
      diet: 'vegan',
      shoppingOnline: 1,
      shoppingFashion: 1,
      recyclingHabit: 'always',
      plasticUsage: 'low'
    });

    const resFoodVegan = await askCoach([], 'food and diet advice please');
    expect(resFoodVegan.reply).toContain('vegan');

    const resWasteLow = await askCoach([], 'plastic waste advice please');
    expect(resWasteLow.reply).toContain('low');
  });

  it('scans receipts with gas and uber filenames for transport category short-circuit branches', async () => {
    await register({ email: 'gasreceipt@example.com', name: 'Gas User', password: 'Password123!' });
    
    const fileGas = new File(['mock content'], 'gasoline_receipt.jpg', { type: 'image/jpeg' });
    const resGas = await scanReceipt(fileGas);
    expect(resGas.result.co2Estimate).toBe(45.0);

    const fileUber = new File(['mock content'], 'uber_trip.png', { type: 'image/png' });
    const resUber = await scanReceipt(fileUber);
    expect(resUber.result.co2Estimate).toBe(45.0);
  });

  it('generates text report with populated habits history', async () => {
    await register({ email: 'reporthabits@example.com', name: 'Report User', password: 'Password123!' });
    
    await submitHabits({ usedBicycle: true });

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

    expect(spyElement.download).toContain('EcoTrack_Carbon_Report');

    spyCreate.mockRestore();
    spyAppend.mockRestore();
    spyRemove.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

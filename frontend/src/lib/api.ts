// EcoTrack AI Enterprise API Client helper

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/_backend/api'
  : 'http://localhost:5001/api';

// Store JWT Access Token in-memory for security
let inMemoryAccessToken: string | null = null;

/**
 * Custom fetch wrapper that appends JWT Authorization and handles silent token refresh
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }
  
  // Enforce sending credentials (HTTP-only cookies for refresh tokens)
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include' // crucial for reading/writing cross-origin HTTP-only cookies
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, token might have expired. Try rotating/refreshing.
  if ((response.status === 401 || response.status === 403) && !url.includes('/auth/refresh')) {
    try {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry original request with new token
        headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
        response = await fetch(url, fetchOptions);
      }
    } catch (e) {
      console.warn('Silent token refresh failed, forcing logout:', e);
      logout();
    }
  }

  return response;
}

/**
 * Attempts to call refresh token rotation endpoint
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      inMemoryAccessToken = data.accessToken;
      return true;
    }
  } catch (e) {
    console.error('Network error during token refresh:', e);
  }
  return false;
}

/**
 * Logs out the user, clearing tokens and cookies
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('Network error during logout API call:', e);
  }

  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ecotrack_user');
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
}

/**
 * Check if the user is authenticated. 
 * Attempts a silent token refresh if inMemory token is empty.
 */
export async function checkAuthStatus(): Promise<any | null> {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem('ecotrack_user');
  if (!storedUser) return null;

  // If token is missing, attempt rotation first
  if (!inMemoryAccessToken) {
    const refreshed = await attemptTokenRefresh();
    if (!refreshed) {
      logout();
      return null;
    }
  }

  try {
    const response = await authFetch(`${API_BASE}/auth/profile`);
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('ecotrack_user', JSON.stringify(user));
      return user;
    }
  } catch (e) {
    console.error('Profile verification failed:', e);
  }
  return null;
}

/**
 * Login user
 */
export async function login(credentials: { email: string; password?: string }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Authentication failed');
  }

  const data = await response.json();
  inMemoryAccessToken = data.accessToken;
  localStorage.setItem('ecotrack_user', JSON.stringify(data.user));
  window.dispatchEvent(new Event('ecotrack-user-updated'));
  return data.user;
}

/**
 * Register user
 */
export async function register(profile: { email: string; password?: string; name: string }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Registration failed');
  }

  const data = await response.json();
  inMemoryAccessToken = data.accessToken;
  localStorage.setItem('ecotrack_user', JSON.stringify(data.user));
  window.dispatchEvent(new Event('ecotrack-user-updated'));
  return data.user;
}

/**
 * Get dashboard stats for a user
 */
export async function getDashboardStats() {
  const response = await authFetch(`${API_BASE}/dashboard`);
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return await response.json();
}

/**
 * Submit carbon calculation parameters
 */
export async function submitCalculation(data: any) {
  const response = await authFetch(`${API_BASE}/calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Calculation submission failed');
  }
  const result = await response.json();
  
  if (result.updatedUser) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.updatedUser));
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
  return result;
}

/**
 * Update daily habits tracker checklist
 */
export async function submitHabits(habits: any) {
  const response = await authFetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habits)
  });
  if (!response.ok) throw new Error('Habit submission failed');
  const result = await response.json();
  
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
  return result;
}

/**
 * Get community leaderboard rank list
 */
export async function getLeaderboard() {
  const response = await authFetch(`${API_BASE}/leaderboard`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return await response.json();
}

/**
 * Fetch available Challenges
 */
export async function getChallenges() {
  const response = await authFetch(`${API_BASE}/challenges`);
  if (!response.ok) throw new Error('Failed to fetch challenges');
  return await response.json();
}

/**
 * Join a green challenge
 */
export async function joinChallenge(challengeId: string) {
  const response = await authFetch(`${API_BASE}/challenges/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId })
  });
  if (!response.ok) throw new Error('Failed to join challenge');
  return await response.json();
}

/**
 * Complete and claim challenge reward points
 */
export async function claimChallengeReward(userChallengeId: string) {
  const response = await authFetch(`${API_BASE}/challenges/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userChallengeId })
  });
  if (!response.ok) throw new Error('Failed to claim reward');
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
  return result;
}

/**
 * Send request to Gemini AI Sustainability Coach
 */
export async function askCoach(history: any[], message: string) {
  const response = await authFetch(`${API_BASE}/ai/coach`, {
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
export async function scanReceipt(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authFetch(`${API_BASE}/ai/scan-receipt`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Receipt scanning failed');
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
  return result;
}

/**
 * Spend Eco Points in Marketplace
 */
export async function buyOffset(cost: number, name: string) {
  const response = await authFetch(`${API_BASE}/offset/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cost, name })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Offset transaction failed');
  }
  const result = await response.json();
  if (result.user) {
    localStorage.setItem('ecotrack_user', JSON.stringify(result.user));
    window.dispatchEvent(new Event('ecotrack-user-updated'));
  }
  return result;
}

/**
 * Get PDF Report download URL
 */
export function getPdfReportUrl(): string {
  return `${API_BASE}/reports/pdf`;
}

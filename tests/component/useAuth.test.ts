import { renderHook, act, waitFor } from '@testing-library/react';
import useAuth from '../../src/hooks/useAuth';
import { checkAuthStatus, logout as apiLogout } from '../../src/lib/api';
import { useRouter, usePathname } from 'next/navigation';

// Mock API
jest.mock('../../src/lib/api', () => ({
  checkAuthStatus: jest.fn(),
  logout: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/some-path',
}));

describe('useAuth Custom Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies logged in user status successfully', async () => {
    const mockUser = { id: 'u-1', name: 'Test User', email: 'test@example.com' };
    (checkAuthStatus as jest.Mock).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(false));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('redirects to login if user is unauthorized and requireAuth is true', async () => {
    (checkAuthStatus as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('does not redirect if user is unauthorized and requireAuth is false', async () => {
    (checkAuthStatus as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('redirects to login if checkAuthStatus throws an error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (checkAuthStatus as jest.Mock).mockRejectedValueOnce(new Error('Auth API error'));

    const { result } = renderHook(() => useAuth(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    consoleSpy.mockRestore();
  });

  it('performs api logout and redirects', async () => {
    (checkAuthStatus as jest.Mock).mockResolvedValueOnce({ name: 'User' });
    (apiLogout as jest.Mock).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(false));

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(apiLogout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('re-verifies user when ecotrack-user-updated event fires', async () => {
    const mockUser1 = { id: 'u-1', name: 'User 1' };
    const mockUser2 = { id: 'u-1', name: 'User 2' };
    
    (checkAuthStatus as jest.Mock)
      .mockResolvedValueOnce(mockUser1)
      .mockResolvedValueOnce(mockUser2);

    const { result } = renderHook(() => useAuth(false));

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser1);
    });

    // Trigger update event
    await act(async () => {
      window.dispatchEvent(new Event('ecotrack-user-updated'));
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser2);
    });
  });

  it('handles useAuth with default requireAuth parameter (true)', async () => {
    (checkAuthStatus as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth()); // tests requireAuth = true default

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('does not redirect if checkAuthStatus throws an error and requireAuth is false', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (checkAuthStatus as jest.Mock).mockRejectedValueOnce(new Error('Auth API error'));

    const { result } = renderHook(() => useAuth(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockPush).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

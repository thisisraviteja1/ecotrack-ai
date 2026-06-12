import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LeaderboardPage from '../../src/app/leaderboard/page';
import { getLeaderboard } from '../../src/lib/api';
import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');

// Mock api client
jest.mock('../../src/lib/api', () => ({
  getLeaderboard: jest.fn(),
}));

describe('LeaderboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-curr', name: 'Current User Name', email: 'curr@example.com', points: 450, level: 'Eco Explorer' },
      loading: false,
    });
  });


  it('renders leaderboard elements correctly, podiums and tables', async () => {
    // 5 mock users + current user will be dynamically added since it's not present
    const mockBoard = [
      { id: 'u-sarah', name: 'Sarah Jenkins', points: 1250, level: 'Climate Champion', email: 'sarah@example.com' },
      { id: '', name: 'Alex Rivera', points: 920, level: 'Sustainability Hero', email: 'alex@example.com' },
      { id: 'u-david', name: 'David Chen', points: 740, level: 'Sustainability Hero', email: 'david@example.com' },
      { id: '', name: 'Emily Watson', points: 300, level: 'Eco Explorer', email: 'emily@example.com' }
    ];

    (getLeaderboard as jest.Mock).mockResolvedValueOnce(mockBoard);

    render(<LeaderboardPage />);

    // Top 3 should render in podium
    await waitFor(() => {
      expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
      expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
      expect(screen.getByText('David Chen')).toBeInTheDocument();
    });

    // The other users + current user should render in the list.
    // Wait, the current user has 450 XP, which places them 4th (between David Chen 740 XP and Emily Watson 300 XP).
    // So current user will be in the table.
    expect(screen.getByText('Current User Name')).toBeInTheDocument();
    expect(screen.getAllByText('You').length).toBeGreaterThan(0);
  });

  it('logs error when getLeaderboard fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getLeaderboard as jest.Mock).mockRejectedValueOnce(new Error('Leaderboard fetch failed'));

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch leaderboard:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders correctly when current user is already on the leaderboard', async () => {
    const mockBoard = [
      { id: '1', name: 'Sarah Jenkins', points: 1250, level: 'Climate Champion', email: 'sarah@example.com' },
      { id: '2', name: 'Alex Rivera', points: 920, level: 'Sustainability Hero', email: 'alex@example.com' },
      { id: '3', name: 'David Chen', points: 740, level: 'Sustainability Hero', email: 'david@example.com' },
      { id: 'user-curr', name: 'Current User Name', points: 450, level: 'Eco Explorer', email: 'curr@example.com' }
    ];

    (getLeaderboard as jest.Mock).mockResolvedValueOnce(mockBoard);

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Current User Name')).toBeInTheDocument();
      expect(screen.getAllByText('You').length).toBe(1);
    });
  });

  it('renders correctly when current user is in top 3 podium', async () => {
    const mockBoard = [
      { id: 'user-curr', name: 'Current User Name', points: 1500, level: 'Climate Champion', email: 'curr@example.com' },
      { id: '2', name: 'Alex Rivera', points: 920, level: 'Sustainability Hero', email: 'alex@example.com' },
      { id: '3', name: 'David Chen', points: 740, level: 'Sustainability Hero', email: 'david@example.com' }
    ];

    (getLeaderboard as jest.Mock).mockResolvedValueOnce(mockBoard);

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Current User Name')).toBeInTheDocument();
      expect(screen.getAllByText('You').length).toBe(1);
    });
  });

  it('does not fetch leaderboard if user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<LeaderboardPage />);

    await waitFor(() => {
      expect(getLeaderboard).not.toHaveBeenCalled();
    });
  });

  it('renders loading skeleton when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<LeaderboardPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});

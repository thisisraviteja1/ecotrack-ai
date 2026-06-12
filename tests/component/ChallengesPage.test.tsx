import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChallengesPage from '../../src/app/challenges/page';
import { submitHabits, getChallenges, joinChallenge, claimChallengeReward, getDashboardStats } from '../../src/lib/api';
import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');
const mockRefetch = jest.fn();

// Mock api client
jest.mock('../../src/lib/api', () => ({
  submitHabits: jest.fn(),
  getChallenges: jest.fn(),
  joinChallenge: jest.fn(),
  claimChallengeReward: jest.fn(),
  getDashboardStats: jest.fn(),
}));

describe('ChallengesPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
  });

  it('renders habits list and challenges page data', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [{
        date: new Date().toISOString(),
        usedBicycle: true,
        avoidedPlastic: false,
        usedPublicTransport: false,
        savedElectricity: false,
        recycledWaste: false,
        carpooled: false
      }],
      activeChallenges: [{
        id: 'user-ch-1',
        challengeId: 'ch-1',
        status: 'IN_PROGRESS',
        challenge: { id: 'ch-1', title: 'No Plastic Week', description: 'Avoid single-use plastics', points: 150 }
      }],
      completedChallenges: [{
        id: 'user-ch-2',
        challengeId: 'ch-2',
        status: 'COMPLETED',
        challenge: { id: 'ch-2', title: 'Public Transport Challenge', description: 'Commute by metro', points: 200 }
      }]
    });

    (getChallenges as jest.Mock).mockResolvedValue([
      { id: 'ch-1', title: 'No Plastic Week', description: 'Avoid single-use plastics', points: 150 },
      { id: 'ch-2', title: 'Public Transport Challenge', description: 'Commute by metro', points: 200 },
      { id: 'ch-3', title: 'Plant a Tree Challenge', description: 'Plant a tree', points: 250 }
    ]);

    render(<ChallengesPage />);

    // Check loading skeleton disappears and habits display
    await waitFor(() => {
      expect(screen.getByText(/Daily Habit Tracker/i)).toBeInTheDocument();
      expect(screen.getByText('Bicycled instead of driving')).toBeInTheDocument();
    });

    // Check custom checks are evaluated
    const bicycleCheck = screen.getByRole('checkbox', { name: /Bicycled instead of driving/i });
    expect(bicycleCheck).toHaveAttribute('aria-checked', 'true');

    // Check active challenges display
    expect(screen.getByText('Active Quests In Progress')).toBeInTheDocument();
    expect(screen.getAllByText('No Plastic Week').length).toBeGreaterThan(0);

    // Check completed challenges displays
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('toggles habit checkboxes and calls submitHabits API', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [],
      activeChallenges: [],
      completedChallenges: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    (submitHabits as jest.Mock).mockResolvedValue({ success: true });

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByText('Bicycled instead of driving')).toBeInTheDocument();
    });

    const bicycleCheck = screen.getByRole('checkbox', { name: /Bicycled instead of driving/i });
    expect(bicycleCheck).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(bicycleCheck);

    await waitFor(() => {
      expect(submitHabits).toHaveBeenCalledWith({
        usedBicycle: true,
        avoidedPlastic: false,
        usedPublicTransport: false,
        savedElectricity: false,
        recycledWaste: false,
        carpooled: false
      });
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('joins a new challenge quest when enroll clicked', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [],
      activeChallenges: [],
      completedChallenges: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([
      { id: 'ch-3', title: 'Plant a Tree Challenge', description: 'Plant a tree', points: 250 }
    ]);
    (joinChallenge as jest.Mock).mockResolvedValue({ success: true });

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enroll Quest/i })).toBeInTheDocument();
    });

    const enrollBtn = screen.getByRole('button', { name: /Enroll Quest/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(joinChallenge).toHaveBeenCalledWith('ch-3');
    });
  });

  it('completes active quest when complete button clicked', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [],
      activeChallenges: [{
        id: 'user-ch-1',
        challengeId: 'ch-1',
        status: 'IN_PROGRESS',
        challenge: { id: 'ch-1', title: 'No Plastic Week', description: 'Avoid single-use plastics', points: 150 }
      }],
      completedChallenges: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    (claimChallengeReward as jest.Mock).mockResolvedValue({ success: true });

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Mission/i })).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Complete Mission/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(claimChallengeReward).toHaveBeenCalledWith('user-ch-1');
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('handles getDashboardStats load failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockRejectedValueOnce(new Error('Load error'));

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load page data:', expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles submitHabits failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockResolvedValue({ habits: [], activeChallenges: [], completedChallenges: [] });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    (submitHabits as jest.Mock).mockRejectedValueOnce(new Error('Submit error'));

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByText('Bicycled instead of driving')).toBeInTheDocument();
    });

    const bicycleCheck = screen.getByRole('checkbox', { name: /Bicycled instead of driving/i });
    fireEvent.click(bicycleCheck);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save habit checklist'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles joinChallenge failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockResolvedValue({ habits: [], activeChallenges: [], completedChallenges: [] });
    (getChallenges as jest.Mock).mockResolvedValue([{ id: 'ch-3', title: 'Plant a tree', points: 100 }]);
    (joinChallenge as jest.Mock).mockRejectedValueOnce(new Error('Join error'));

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enroll Quest/i })).toBeInTheDocument();
    });

    const enrollBtn = screen.getByRole('button', { name: /Enroll Quest/i });
    fireEvent.click(enrollBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to enroll in challenge'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles claimChallengeReward failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [],
      activeChallenges: [{
        id: 'user-ch-1',
        challengeId: 'ch-1',
        status: 'IN_PROGRESS',
        challenge: { id: 'ch-1', title: 'No Plastic Week', description: 'Avoid single-use plastics', points: 150 }
      }],
      completedChallenges: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    (claimChallengeReward as jest.Mock).mockRejectedValueOnce(new Error('Claim error'));

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Mission/i })).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Complete Mission/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to claim reward points'));
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('does not toggle habits or join challenges if user is null', async () => {
    // 1. Start with a valid user so challenges render
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    (getDashboardStats as jest.Mock).mockResolvedValue({ habits: [], activeChallenges: [], completedChallenges: [] });
    (getChallenges as jest.Mock).mockResolvedValue([
      { id: 'ch-3', title: 'Plant a tree', points: 100 }
    ]);

    const { rerender } = render(<ChallengesPage />);

    // Wait for it to load and render the Enroll button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enroll Quest/i })).toBeInTheDocument();
    });

    // 2. Change mock to return null user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      refetch: mockRefetch,
    });

    // Rerender the component with the new mock value active
    rerender(<ChallengesPage />);

    // Try to click Bicycled habit
    const bicycleCheck = screen.getByRole('checkbox', { name: /Bicycled instead of driving/i });
    fireEvent.click(bicycleCheck);
    expect(submitHabits).not.toHaveBeenCalled();

    // Try to click Enroll Quest button
    const enrollBtn = screen.getByRole('button', { name: /Enroll Quest/i });
    fireEvent.click(enrollBtn);
    expect(joinChallenge).not.toHaveBeenCalled();
  });

  it('handles yesterday-only habit history correctly', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: [{
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        usedBicycle: true,
        avoidedPlastic: false,
        usedPublicTransport: false,
        savedElectricity: false,
        recycledWaste: false,
        carpooled: false
      }],
      activeChallenges: [],
      completedChallenges: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([]);

    render(<ChallengesPage />);

    await waitFor(() => {
      expect(screen.getByText('Bicycled instead of driving')).toBeInTheDocument();
    });

    // Because there is no todayHabit, the checkboxes should all be false
    const bicycleCheck = screen.getByRole('checkbox', { name: /Bicycled instead of driving/i });
    expect(bicycleCheck).toHaveAttribute('aria-checked', 'false');
  });

  it('does not load data if user is null and auth is loading', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      refetch: mockRefetch,
    });
    render(<ChallengesPage />);
    expect(getDashboardStats).not.toHaveBeenCalled();
  });

  it('handles dashboard stats without active/completed challenges properties', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    (getDashboardStats as jest.Mock).mockResolvedValue({
      habits: []
    });
    (getChallenges as jest.Mock).mockResolvedValue([]);
    render(<ChallengesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Daily Habit Tracker/i)).toBeInTheDocument();
    });
  });
});

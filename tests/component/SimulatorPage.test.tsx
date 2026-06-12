import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimulatorPage from '../../src/app/simulator/page';
import { getDashboardStats } from '../../src/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

// Mock api client
jest.mock('../../src/lib/api', () => ({
  getDashboardStats: jest.fn(),
}));

import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');

// Mock Recharts ResponsiveContainer to render content in Jest environment
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: '800px', height: '400px' }}>{children}</div>
    ),
  };
});

describe('SimulatorPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', email: 'test@example.com', name: 'Test User', points: 100, level: 'Beginner' },
      loading: false,
    });
  });

  it('renders simulator baseline statistics, sliders, and avatar twin correctly', async () => {
    const mockStatsOutput = {
      points: 100,
      level: 'Beginner',
      lastCalculation: {
        transportMode: 'car',
        travelDistance: 20,
        electricity: 150,
        acUsage: 4,
        diet: 'mixed',
        shoppingOnline: 2,
        shoppingFashion: 0,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium',
        totalCO2: 320,
        carbonScore: 57,
        rating: 'C'
      }
    };
    
    (getDashboardStats as jest.Mock).mockResolvedValue(mockStatsOutput);

    render(<SimulatorPage />);

    // Wait for stats to load and skeleton to disappear
    await waitFor(() => {
      expect(screen.getByText(/Impact Behavior Simulator/i)).toBeInTheDocument();
      expect(screen.getByText(/My Carbon Twin/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Learner Avatar/i)).toBeInTheDocument();
    });

    // Check sliders are populated with baseline numbers
    const distanceSlider = screen.getByLabelText(/Simulated Daily Distance/i);
    expect(distanceSlider).toHaveValue('20');

    // Simulate slider change
    fireEvent.change(distanceSlider, { target: { value: '50' } });
    expect(distanceSlider).toHaveValue('50');

    // Reset button click
    const resetBtn = screen.getByRole('button', { name: /reset simulation/i });
    fireEvent.click(resetBtn);
    expect(distanceSlider).toHaveValue('20');
  });

  it('renders eco champion avatar crown for score >= 85', async () => {
    const mockStatsOutput = {
      points: 800,
      level: 'Sustainability Hero',
      lastCalculation: {
        transportMode: 'cycling',
        travelDistance: 0,
        electricity: 20,
        acUsage: 0,
        diet: 'vegetarian',
        shoppingOnline: 0,
        shoppingFashion: 0,
        recyclingHabit: 'always',
        plasticUsage: 'low',
        totalCO2: 40,
        carbonScore: 95,
        rating: 'A'
      }
    };

    (getDashboardStats as jest.Mock).mockResolvedValue(mockStatsOutput);

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(screen.getByText(/Eco Champion Avatar/i)).toBeInTheDocument();
      expect(screen.getByText('Eco King')).toBeInTheDocument();
    });
  });

  it('falls back to default baseline calculation if user has no calculation history', async () => {
    const mockStatsOutputNoHistory = {
      points: 50,
      level: 'Beginner',
      lastCalculation: null // No calculations yet
    };

    (getDashboardStats as jest.Mock).mockResolvedValue(mockStatsOutputNoHistory);

    render(<SimulatorPage />);

    // Wait for the defaults to load
    await waitFor(() => {
      expect(screen.getByText(/Impact Behavior Simulator/i)).toBeInTheDocument();
    });

    // Verify default values are present in inputs
    const distanceSlider = screen.getByLabelText(/Simulated Daily Distance/i);
    expect(distanceSlider).toHaveValue('15'); // default

    // Verify default simulated score of 39 maps to Smoggy & Polluted
    expect(screen.getByText(/Smoggy & Polluted/i)).toBeInTheDocument();
  });

  it('updates simulated footprint when diet and recycling selections change', async () => {
    const mockStatsOutput = {
      points: 100,
      level: 'Beginner',
      lastCalculation: {
        transportMode: 'car',
        travelDistance: 20,
        electricity: 150,
        acUsage: 4,
        diet: 'mixed',
        shoppingOnline: 2,
        shoppingFashion: 0,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium',
        totalCO2: 320,
        carbonScore: 57,
        rating: 'C'
      }
    };

    (getDashboardStats as jest.Mock).mockResolvedValue(mockStatsOutput);

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Simulated Diet Option/i)).toBeInTheDocument();
    });

    const dietSelect = screen.getByLabelText(/Simulated Diet Option/i);
    const recyclingSelect = screen.getByLabelText(/Simulated Recycling Habits/i);
    const electricitySlider = screen.getByLabelText(/Simulated Monthly Electric/i);
    const acSlider = screen.getByLabelText(/Simulated AC Usage/i);

    // Change diet to vegetarian and recycling to always
    fireEvent.change(dietSelect, { target: { value: 'vegetarian' } });
    fireEvent.change(recyclingSelect, { target: { value: 'always' } });
    fireEvent.change(electricitySlider, { target: { value: '300' } });
    fireEvent.change(acSlider, { target: { value: '8' } });

    expect(dietSelect).toHaveValue('vegetarian');
    expect(recyclingSelect).toHaveValue('always');
    expect(electricitySlider).toHaveValue('300');
    expect(acSlider).toHaveValue('8');
  });

  it('renders healthy planet avatar for score >= 70 and < 85', async () => {
    const mockStatsOutput = {
      points: 400,
      level: 'Sustainability Hero',
      lastCalculation: {
        transportMode: 'cycling',
        travelDistance: 0,
        electricity: 100,
        acUsage: 2,
        diet: 'vegetarian',
        shoppingOnline: 1,
        shoppingFashion: 1,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium',
        totalCO2: 150,
        carbonScore: 75, // score 75
        rating: 'B'
      }
    };

    (getDashboardStats as jest.Mock).mockResolvedValue(mockStatsOutput);

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(screen.getByText(/Healthy Planet Avatar/i)).toBeInTheDocument();
    });
  });

  it('logs error when loadStats fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load simulator baseline:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('does not load simulator stats if user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(getDashboardStats).not.toHaveBeenCalled();
    });
  });

  it('handles undefined or zero lastCalculation parameters in baseline load', async () => {
    const mockStatsOutput = {
      points: 100,
      level: 'Beginner',
      lastCalculation: {}
    };
    (getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStatsOutput);

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Simulated Daily Distance/i)).toHaveValue('15');
    });
  });

  it('handles reset action when baselineCalc is null', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    // Reset button click when baselineCalc is null
    const resetBtn = screen.getByRole('button', { name: /reset simulation/i });
    fireEvent.click(resetBtn);
    
    // Should not crash and values remain defaults (15, 180, etc.)
    expect(screen.getByLabelText(/Simulated Daily Distance/i)).toHaveValue('15');

    consoleErrorSpy.mockRestore();
  });

  it('handles reset action when baselineCalc has falsy/zero values', async () => {
    const mockStatsOutput = {
      points: 100,
      level: 'Beginner',
      lastCalculation: {
        transportMode: 'car',
        travelDistance: 0,
        electricity: 0,
        acUsage: 0,
        diet: '',
        recyclingHabit: '',
        totalCO2: 0,
        carbonScore: 0,
        rating: 'F'
      }
    };
    (getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStatsOutput);

    render(<SimulatorPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Simulated Daily Distance/i)).toHaveValue('0');
    });

    const distanceSlider = screen.getByLabelText(/Simulated Daily Distance/i);
    fireEvent.change(distanceSlider, { target: { value: '50' } });

    const resetBtn = screen.getByRole('button', { name: /reset simulation/i });
    fireEvent.click(resetBtn);

    expect(distanceSlider).toHaveValue('15');
  });

  it('loads stats only when user becomes non-null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    const { rerender } = render(<SimulatorPage />);
    expect(getDashboardStats).not.toHaveBeenCalled();

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', email: 'test@example.com', name: 'Test User', points: 100, level: 'Beginner' },
      loading: false,
    });

    rerender(<SimulatorPage />);

    await waitFor(() => {
      expect(getDashboardStats).toHaveBeenCalled();
    });
  });
});

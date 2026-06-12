import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '../../src/app/dashboard/page';
import { getDashboardStats, downloadTextReport } from '../../src/lib/api';
import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');


// Mock api client
jest.mock('../../src/lib/api', () => ({
  getDashboardStats: jest.fn(),
  downloadTextReport: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock Recharts
jest.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div />,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
  };
});

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 150, level: 'Eco Explorer' },
      loading: false,
    });
  });

  it('renders loading skeleton initially', () => {
    (getDashboardStats as jest.Mock).mockReturnValue(new Promise(() => {})); // pending promise
    render(<DashboardPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders empty profile dashboard if no calculation history', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      latestCalculation: null,
      reductionPercentage: 0,
      habits: []
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No Emissions Profile Found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Start Calculator/i })).toBeInTheDocument();
    });
  });

  it('renders full dashboard statistics and charts when data is loaded', async () => {
    (getDashboardStats as jest.Mock).mockResolvedValue({
      latestCalculation: {
        transportCO2: 120,
        energyCO2: 100,
        foodCO2: 50,
        shoppingCO2: 40,
        wasteCO2: 20,
        totalCO2: 330,
        carbonScore: 72,
        rating: 'B'
      },
      reductionPercentage: 18,
      habits: [
        { date: '2026-06-12T10:00:00Z', pointsEarned: 30 }
      ],
      prediction: {
        explanation: 'AI expects reductions from recycling.',
        forecastAnnualWithoutChange: 3960,
        forecastAnnualWithChange: 3240
      }
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Carbon Analytics Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/330.0/i)).toBeInTheDocument(); // total monthly emissions
      expect(screen.getByText(/72/i)).toBeInTheDocument(); // carbon score
      expect(screen.getByText(/18%/i)).toBeInTheDocument(); // reduction percentage
      expect(screen.getByText(/AI expects reductions from recycling./i)).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Test download report trigger
    const downloadBtn = screen.getByRole('button', { name: /Download Carbon Report/i });
    fireEvent.click(downloadBtn);
    expect(downloadTextReport).toHaveBeenCalled();
  });

  it('logs error when getDashboardStats fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getDashboardStats as jest.Mock).mockRejectedValue(new Error('Dashboard API Error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load dashboard data:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('does not load dashboard data if user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(getDashboardStats).not.toHaveBeenCalled();
    });
  });
});

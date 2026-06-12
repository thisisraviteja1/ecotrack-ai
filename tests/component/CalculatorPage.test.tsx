import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalculatorPage from '../../src/app/calculator/page';
import { submitCalculation } from '../../src/lib/api';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: () => {},
    };
  },
}));

// Mock api client
jest.mock('../../src/lib/api', () => ({
  submitCalculation: jest.fn(),
}));

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth', () => {
  return jest.fn().mockReturnValue({
    user: { id: 'u-1', email: 'test@example.com', name: 'Test User', points: 100, level: 'Beginner' },
    loading: false,
  });
});

describe('CalculatorPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('steps through transport mode and calculates emissions successfully', async () => {
    const mockCalcOutput = {
      success: true,
      calculation: {
        id: 'calc-123',
        transportMode: 'car',
        travelDistance: 15,
        electricity: 180,
        acUsage: 4,
        diet: 'mixed',
        shoppingOnline: 4,
        shoppingFashion: 2,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium',
        transportCO2: 81,
        energyCO2: 168,
        foodCO2: 150,
        shoppingCO2: 42,
        wasteCO2: 15,
        totalCO2: 456,
        carbonScore: 39,
        rating: 'E'
      }
    };
    
    (submitCalculation as jest.Mock).mockResolvedValue(mockCalcOutput);

    render(<CalculatorPage />);

    // STEP 1: Transportation
    expect(screen.getByText(/Step 1 of 5: Transportation/i)).toBeInTheDocument();
    
    // Check next button works
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    // STEP 2: Energy Consumption
    expect(screen.getByText(/Step 2 of 5: Energy Consumption/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // STEP 3: Dietary Habits
    expect(screen.getByText(/Step 3 of 5: Dietary Habits/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // STEP 4: Shopping Habits
    expect(screen.getByText(/Step 4 of 5: Shopping Habits/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // STEP 5: Waste Management
    expect(screen.getByText(/Step 5 of 5: Waste Management/i)).toBeInTheDocument();
    
    // Select always recycling
    const recyclingSelect = screen.getByLabelText(/recycling and composting/i);
    fireEvent.change(recyclingSelect, { target: { value: 'always' } });

    // Submit calculation
    const submitBtn = screen.getByRole('button', { name: /calculate footprint/i });
    fireEvent.click(submitBtn);

    // Verify it submits with proper data
    await waitFor(() => {
      expect(submitCalculation).toHaveBeenCalledWith(expect.objectContaining({
        recyclingHabit: 'always',
        transportMode: 'car'
      }));
    });

    // Check that completion results screen is displayed
    await waitFor(() => {
      expect(screen.getByText(/Calculation Complete!/i)).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument(); // rating
      expect(screen.getByText(/456.0/i)).toBeInTheDocument(); // total CO2
    });

    // Test Recalculate button reset
    const recalculateBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(recalculateBtn);
    expect(screen.getByText(/Step 5 of 5: Waste Management/i)).toBeInTheDocument();

    // Go back to result state for other tests
    fireEvent.click(screen.getByRole('button', { name: /calculate footprint/i }));
    await waitFor(() => expect(screen.getByText(/Calculation Complete!/i)).toBeInTheDocument());

    // Verify view dashboard button navigates
    const dashboardBtn = screen.getByRole('button', { name: /view carbon dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles submission error gracefully', async () => {
    (submitCalculation as jest.Mock).mockRejectedValueOnce(new Error('Calculation failed'));
    const spyConsole = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<CalculatorPage />);

    // Go to step 5 directly by clicking next multiple times
    fireEvent.click(screen.getByRole('button', { name: /next/i })); // 2
    fireEvent.click(screen.getByRole('button', { name: /next/i })); // 3
    fireEvent.click(screen.getByRole('button', { name: /next/i })); // 4
    fireEvent.click(screen.getByRole('button', { name: /next/i })); // 5

    const submitBtn = screen.getByRole('button', { name: /calculate footprint/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(spyConsole).toHaveBeenCalled();
      expect(spyAlert).toHaveBeenCalledWith(expect.stringContaining('Failed to calculate footprint'));
    });

    spyConsole.mockRestore();
    spyAlert.mockRestore();
  });
});

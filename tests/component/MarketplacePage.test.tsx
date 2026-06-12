import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarketplacePage from '../../src/app/marketplace/page';
import { buyOffset } from '../../src/lib/api';
import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');
const mockRefetch = jest.fn();

// Mock api client
jest.mock('../../src/lib/api', () => ({
  buyOffset: jest.fn(),
}));

describe('MarketplacePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders marketplace offset projects and balance', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 600, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    render(<MarketplacePage />);
    
    expect(screen.getByText(/Spend Eco Points/i)).toBeInTheDocument();
    expect(screen.getByText('600 XP')).toBeInTheDocument(); // balance
    expect(screen.getByText('Reforest the Amazon')).toBeInTheDocument();
  });

  it('allows buying offsets if user has sufficient XP balance', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 600, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    (buyOffset as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<MarketplacePage />);

    // Redeem Amazon project (cost: 300)
    const redeemBtn = screen.getAllByRole('button', { name: /Redeem Offset/i })[0];
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(buyOffset).toHaveBeenCalledWith(300, 'Reforest the Amazon');
      expect(mockRefetch).toHaveBeenCalled();
      expect(screen.getByText(/Successfully purchased offset project: Reforest the Amazon/i)).toBeInTheDocument();
    });
  });

  it('prevents purchase and shows alert if user has insufficient XP balance', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 50, level: 'Beginner' },
      loading: false,
      refetch: mockRefetch,
    });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<MarketplacePage />);

    // Try to click Reforest Amazon (cost: 300) which should display Insufficient XP on button
    const redeemBtn = screen.getAllByRole('button', { name: /Insufficient XP/i })[0];
    expect(redeemBtn).toBeDisabled();
    
    // Bypass React event delegator by invoking the fiber onClick handler directly
    const reactPropsKey = Object.keys(redeemBtn).find(k => k.startsWith('__reactProps$'));
    const reactProps = reactPropsKey ? (redeemBtn as any)[reactPropsKey] : null;
    
    if (reactProps && typeof reactProps.onClick === 'function') {
      reactProps.onClick({ preventDefault: () => {} });
    }
    
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Insufficient Eco Points'));
    expect(buyOffset).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('shows error alert if purchase offset API throws', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 600, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (buyOffset as jest.Mock).mockRejectedValueOnce(new Error('Transaction Error'));

    render(<MarketplacePage />);

    const redeemBtn = screen.getAllByRole('button', { name: /Redeem Offset/i })[0];
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Transaction Error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('shows fallback error alert if purchase offset API throws error without message', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u-1', name: 'John Doe', points: 600, level: 'Eco Explorer' },
      loading: false,
      refetch: mockRefetch,
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    (buyOffset as jest.Mock).mockRejectedValueOnce({}); // empty object -> no message

    render(<MarketplacePage />);

    const redeemBtn = screen.getAllByRole('button', { name: /Redeem Offset/i })[0];
    fireEvent.click(redeemBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Transaction failed. Check connection.');
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('renders loading skeleton when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      refetch: mockRefetch,
    });

    render(<MarketplacePage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('does not process purchase if user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      refetch: mockRefetch,
    });

    render(<MarketplacePage />);
    
    const redeemBtn = screen.getAllByRole('button', { name: /Insufficient XP/i })[0];
    
    const reactPropsKey = Object.keys(redeemBtn).find(k => k.startsWith('__reactProps$'));
    const reactProps = reactPropsKey ? (redeemBtn as any)[reactPropsKey] : null;
    
    if (reactProps && typeof reactProps.onClick === 'function') {
      reactProps.onClick({ preventDefault: () => {} });
    }

    expect(buyOffset).not.toHaveBeenCalled();
  });
});

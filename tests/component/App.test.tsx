import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from '../../src/App';

// Mock all subpages
jest.mock('../../src/app/page', () => () => <div data-testid="landing-view">Landing Page</div>);
jest.mock('../../src/app/dashboard/page', () => () => <div data-testid="dashboard-view">Dashboard Page</div>);
jest.mock('../../src/app/calculator/page', () => () => <div data-testid="calculator-view">Calculator Page</div>);
jest.mock('../../src/app/coach/page', () => () => <div data-testid="coach-view">Coach Page</div>);
jest.mock('../../src/app/challenges/page', () => () => <div data-testid="challenges-view">Challenges Page</div>);
jest.mock('../../src/app/marketplace/page', () => () => <div data-testid="marketplace-view">Marketplace Page</div>);
jest.mock('../../src/app/leaderboard/page', () => () => <div data-testid="leaderboard-view">Leaderboard Page</div>);
jest.mock('../../src/app/login/page', () => () => <div data-testid="login-view">Login Page</div>);
jest.mock('../../src/app/register/page', () => () => <div data-testid="register-view">Register Page</div>);

// Mock components
jest.mock('../../src/components/Navbar', () => () => <nav data-testid="navbar">Navbar</nav>);

describe('App Root Component Routing', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders landing page by default', () => {
    render(<App />);
    expect(screen.getByTestId('landing-view')).toBeInTheDocument();
  });

  it('routes to dashboard on hash change', async () => {
    render(<App />);
    
    // Simulate hashchange event
    await act(async () => {
      window.location.hash = '#dashboard';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
    });
  });

  it('routes to calculator on custom view change event', async () => {
    render(<App />);
    
    // Dispatch custom event
    await act(async () => {
      const event = new CustomEvent('ecotrack-view-change', { detail: 'calculator' });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByTestId('calculator-view')).toBeInTheDocument();
      expect(window.location.hash).toBe('#calculator');
    });
  });

  it('routes to login and other views correctly', async () => {
    render(<App />);
    
    await act(async () => {
      window.location.hash = '#login';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-view')).toBeInTheDocument();
    });

    await act(async () => {
      window.location.hash = '#register';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('register-view')).toBeInTheDocument();
    });

    await act(async () => {
      window.location.hash = '#challenges';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('challenges-view')).toBeInTheDocument();
    });

    await act(async () => {
      window.location.hash = '#marketplace';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('marketplace-view')).toBeInTheDocument();
    });

    await act(async () => {
      window.location.hash = '#leaderboard';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-view')).toBeInTheDocument();
    });

    await act(async () => {
      window.location.hash = '#coach';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('coach-view')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '../../src/app/page';
import useAuth from '../../src/hooks/useAuth';

// Mock useAuth hook
jest.mock('../../src/hooks/useAuth');

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

describe('LandingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders landing page for non-logged in user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    render(<LandingPage />);
    
    expect(screen.getByText(/Understand Your Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });

  it('renders landing page for logged in user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '1', name: 'John Doe' }, loading: false });
    render(<LandingPage />);
    
    expect(screen.getByText(/Calculate Footprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
  });

  it('renders loading spinner when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: true });
    render(<LandingPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders all features with correct navigation links', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    render(<LandingPage />);
    
    const links = screen.getAllByText('Get Started');
    expect(links).toHaveLength(6);
    expect(links[0].closest('a')).toHaveAttribute('href', '/calculator');
    expect(links[1].closest('a')).toHaveAttribute('href', '/coach');
    expect(links[2].closest('a')).toHaveAttribute('href', '/coach');
    expect(links[3].closest('a')).toHaveAttribute('href', '/challenges');
    expect(links[4].closest('a')).toHaveAttribute('href', '/dashboard');
    expect(links[5].closest('a')).toHaveAttribute('href', '/marketplace');
  });
});

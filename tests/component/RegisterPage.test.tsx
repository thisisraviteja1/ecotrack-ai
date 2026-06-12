import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../../src/app/register/page';
import { register, checkAuthStatus } from '../../src/lib/api';

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
  register: jest.fn(),
  checkAuthStatus: jest.fn().mockResolvedValue(null),
}));

describe('RegisterPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form elements correctly', async () => {
    render(<RegisterPage />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up free/i })).toBeInTheDocument();
  });

  it('shows error if name is an email address', async () => {
    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign up free/i });

    fireEvent.change(nameInput, { target: { value: 'user@example.com' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    // Valid password to enable submit button
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Name cannot be an email address')).toBeInTheDocument();
    });
  });

  it('shows error if email format is invalid', async () => {
    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign up free/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address format')).toBeInTheDocument();
    });
  });

  it('submits form successfully and redirects user', async () => {
    (register as jest.Mock).mockResolvedValueOnce({ success: true });
    
    render(<RegisterPage />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign up free/i });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'user@example.com',
        password: 'Password123!',
      });
      expect(mockPush).toHaveBeenCalledWith('/calculator');
    });
  });
});

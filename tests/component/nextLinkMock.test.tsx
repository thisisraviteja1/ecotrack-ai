import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Link, { triggerViewChange } from '../../src/lib/nextLinkMock';
import { useRouter, usePathname } from '../../src/lib/nextNavigationMock';

describe('Next Router Polyfill Mocks', () => {
  it('triggerViewChange dispatches custom navigation events', () => {
    const spyEvent = jest.fn();
    window.addEventListener('ecotrack-view-change', spyEvent);

    triggerViewChange('/dashboard');
    expect(spyEvent).toHaveBeenCalled();
    expect(spyEvent.mock.calls[0][0].detail).toBe('dashboard');

    // Test root cleanup
    triggerViewChange('/');
    expect(spyEvent.mock.calls[1][0].detail).toBe('landing');
  });

  it('Link component renders correctly and responds to clicks', () => {
    const customClick = jest.fn();
    const spyEvent = jest.fn();
    window.addEventListener('ecotrack-view-change', spyEvent);

    render(
      <Link href="/calculator" className="test-class" onClick={customClick}>
        Go to Calculator
      </Link>
    );

    const anchor = screen.getByRole('link', { name: /Go to Calculator/i });
    expect(anchor).toHaveClass('test-class');
    expect(anchor).toHaveAttribute('href', '/calculator');

    fireEvent.click(anchor);
    expect(customClick).toHaveBeenCalled();
    expect(spyEvent).toHaveBeenCalled();
    expect(spyEvent.mock.calls[0][0].detail).toBe('calculator');
  });

  it('Link component works without custom onClick handler', () => {
    const spyEvent = jest.fn();
    window.addEventListener('ecotrack-view-change', spyEvent);

    render(
      <Link href="/dashboard">
        Go to Dashboard
      </Link>
    );

    const anchor = screen.getByRole('link', { name: /Go to Dashboard/i });
    fireEvent.click(anchor);

    expect(spyEvent).toHaveBeenCalled();
    expect(spyEvent.mock.calls[0][0].detail).toBe('dashboard');
  });

  it('useRouter pushes and replaces views', () => {
    const spyEvent = jest.fn();
    window.addEventListener('ecotrack-view-change', spyEvent);

    const router = useRouter();
    router.push('/coach');
    expect(spyEvent).toHaveBeenCalled();
    expect(spyEvent.mock.calls[0][0].detail).toBe('coach');

    router.replace('/challenges');
    expect(spyEvent.mock.calls[1][0].detail).toBe('challenges');

    // Prefetch and back are safe no-ops
    router.prefetch();
    router.back();
  });

  it('usePathname extracts window hash pathname correctly', () => {
    // 1. Initial state
    window.location.hash = '';
    expect(usePathname()).toBe('/');

    // 2. Hash set
    window.location.hash = '#dashboard';
    expect(usePathname()).toBe('/dashboard');
  });
});

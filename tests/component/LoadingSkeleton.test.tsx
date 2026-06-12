import React from 'react';
import { render } from '@testing-library/react';
import LoadingSkeleton from '../../src/components/LoadingSkeleton';

describe('LoadingSkeleton Component', () => {
  it('renders loading placeholder cards and content sections', () => {
    const { container } = render(<LoadingSkeleton />);
    
    // Check that it renders parent layout container with animate-pulse class
    expect(container.firstChild).toHaveClass('animate-pulse');
    
    // Check it renders glass panels
    const panels = container.querySelectorAll('.glass-panel');
    expect(panels.length).toBe(5); // 4 in grid, 1 in large section
  });
});



import '@testing-library/jest-dom';
import React from 'react';

jest.mock('lucide-react', () => {
  return new Proxy({}, {
    get: (target, prop) => {
      // Return a functional component for any icon name accessed
      const Component = (props: any) => {
        // Exclude icon-specific props that might not be valid on HTML elements
        const { size, ...rest } = props;
        return React.createElement('div', { 'data-testid': `icon-${String(prop)}`, ...rest });
      };
      Component.displayName = String(prop);
      return Component;
    }
  });
});

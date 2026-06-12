/**
 * @jest-environment node
 */

import {
  checkAuthStatus,
  logout
} from '../../src/lib/api';
import { usePathname } from '../../src/lib/nextNavigationMock';
import { triggerViewChange } from '../../src/lib/nextLinkMock';

describe('Local Storage API Client in Node.js (Non-Browser) Environment', () => {
  it('safely handles non-browser environment checkAuthStatus and returns defaultValue', async () => {
    const status = await checkAuthStatus();
    expect(status).toBeNull();
  });

  it('safely runs logout in a non-browser environment without crashing', async () => {
    await expect(logout()).resolves.not.toThrow();
  });

  it('safely handles non-browser environment usePathname and triggerViewChange', () => {
    expect(usePathname()).toBe('/');
    expect(() => triggerViewChange('/dashboard')).not.toThrow();
  });
});

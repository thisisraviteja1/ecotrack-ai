import { test, expect } from '@playwright/test';

test.describe('EcoTrack AI Navigation Flows', () => {
  test('should load landing page and display logo title', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
    
    // Check main heading is visible and contains EcoTrack AI
    const logo = page.locator('span:has-text("EcoTrack")');
    await expect(logo).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check Welcome Back text
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    
    // Verify inputs are visible
    await expect(page.locator('#email-input')).toBeVisible();
    await expect(page.locator('#password-input')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/register');
    
    // Check registration title
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
  });
});

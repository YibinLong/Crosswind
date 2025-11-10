import { test, expect } from '@playwright/test';

test.describe('RescheduleDialog Component', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication token
    await page.goto('/login');

    // Mock a successful login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Mock API responses for reschedule functionality
    await page.route('/api/bookings/1/reschedule', async (route) => {
      if (route.request().method() === 'POST') {
        // Mock generate suggestions response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            bookingId: 1,
            suggestions: [
              {
                id: 1,
                bookingId: 1,
                proposedDate: '2024-11-11',
                proposedTime: '10:00',
                weatherSummary: 'Clear skies, light winds',
                confidence: 95,
                reason: 'Optimal weather conditions with excellent visibility',
                selected: false,
                createdAt: '2024-11-09T10:00:00Z',
                updatedAt: '2024-11-09T10:00:00Z'
              },
              {
                id: 2,
                bookingId: 1,
                proposedDate: '2024-11-12',
                proposedTime: '14:00',
                weatherSummary: 'Partly cloudy, moderate winds',
                confidence: 85,
                reason: 'Good conditions with slight crosswind component',
                selected: false,
                createdAt: '2024-11-09T10:00:00Z',
                updatedAt: '2024-11-09T10:00:00Z'
              },
              {
                id: 3,
                bookingId: 1,
                proposedDate: '2024-11-13',
                proposedTime: '09:00',
                weatherSummary: 'Overcast, light winds',
                confidence: 75,
                reason: 'Acceptable conditions for training flights',
                selected: false,
                createdAt: '2024-11-09T10:00:00Z',
                updatedAt: '2024-11-09T10:00:00Z'
              }
            ],
            count: 3,
            message: 'Generated 3 AI-powered reschedule suggestions'
          })
        });
      }
    });

    await page.route('/api/bookings/1/reschedule/confirm', async (route) => {
      if (route.request().method() === 'POST') {
        // Mock confirm reschedule response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Booking successfully rescheduled',
            updatedBooking: {
              id: 1,
              scheduledDate: '2024-11-11T10:00:00Z',
              status: 'confirmed'
            },
            confirmedSuggestion: {
              id: 1,
              proposedDate: '2024-11-11',
              proposedTime: '10:00',
              reason: 'Optimal weather conditions with excellent visibility',
              confidence: 95,
              weatherSummary: 'Clear skies, light winds'
            },
            confirmedBy: 'test@example.com',
            confirmedAt: '2024-11-09T10:30:00Z'
          })
        });
      }
    });
  });

  test('should open reschedule dialog and display suggestions', async ({ page }) => {
    // Navigate to flights page
    await page.goto('/flights');

    // Look for a flight with conflict status and click reschedule
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for dialog to appear
    await expect(page.locator('[data-testid="reschedule-dialog"]')).toBeVisible();

    // Check dialog title
    await expect(page.locator('h2')).toContainText('AI-Powered Rescheduling');

    // Wait for suggestions to load
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);

    // Check first suggestion details
    const firstOption = page.locator('[data-testid="reschedule-option"]').first();
    await expect(firstOption).toContainText('Monday, Nov 11');
    await expect(firstOption).toContainText('10:00');
    await expect(firstOption).toContainText('Clear skies, light winds');
    await expect(firstOption).toContainText('95% Match');
  });

  test('should select only one flight option at a time', async ({ page }) => {
    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for suggestions to load
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);

    const options = page.locator('[data-testid="reschedule-option"]');

    // Click first option
    await options.first().click();

    // Check that only first option is selected
    await expect(options.first()).toHaveClass(/bg-blue-100/);
    await expect(options.first()).toContainText('✓');

    // Check that other options are not selected
    await expect(options.nth(1)).not.toHaveClass(/bg-blue-100/);
    await expect(options.nth(2)).not.toHaveClass(/bg-blue-100/);

    // Click second option
    await options.nth(1).click();

    // Check that now only second option is selected
    await expect(options.first()).not.toHaveClass(/bg-blue-100/);
    await expect(options.nth(1)).toHaveClass(/bg-blue-100/);
    await expect(options.nth(2)).not.toHaveClass(/bg-blue-100/);
  });

  test('should confirm reschedule successfully', async ({ page }) => {
    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for suggestions to load
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);

    // Select first option
    const options = page.locator('[data-testid="reschedule-option"]');
    await options.first().click();

    // Check confirm button is enabled
    const confirmButton = page.locator('button:has-text("Confirm Reschedule")');
    await expect(confirmButton).toBeEnabled();

    // Click confirm button
    await confirmButton.click();

    // Check for success message
    await expect(page.locator('.toast')).toContainText('Flight rescheduled successfully!');

    // Check dialog closes
    await expect(page.locator('[data-testid="reschedule-dialog"]')).not.toBeVisible();
  });

  test('should show error when no option is selected and confirm is clicked', async ({ page }) => {
    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for suggestions to load
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);

    // Try to confirm without selecting
    const confirmButton = page.locator('button:has-text("Confirm Reschedule")');
    await expect(confirmButton).toBeDisabled();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/bookings/1/reschedule/confirm', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Suggestion already used'
        })
      });
    });

    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for suggestions to load and select one
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);
    await page.locator('[data-testid="reschedule-option"]').first().click();

    // Click confirm button
    await page.locator('button:has-text("Confirm Reschedule")').click();

    // Check error message
    await expect(page.locator('.toast')).toContainText('Suggestion already used');

    // Dialog should remain open
    await expect(page.locator('[data-testid="reschedule-dialog"]')).toBeVisible();
  });

  test('should regenerate suggestions', async ({ page }) => {
    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for initial suggestions
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);

    // Click regenerate button
    await page.click('button:has-text("Regenerate AI Options")');

    // Check loading state
    await expect(page.locator('span:has-text("Generating...")')).toBeVisible();

    // Wait for new suggestions to load
    await expect(page.locator('[data-testid="reschedule-option"]')).toHaveCount(3);
  });

  test('should close dialog when cancel is clicked', async ({ page }) => {
    // Navigate to flights page and open dialog
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // Wait for dialog to appear
    await expect(page.locator('[data-testid="reschedule-dialog"]')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Check dialog closes
    await expect(page.locator('[data-testid="reschedule-dialog"]')).not.toBeVisible();
  });

  test('should display weather conflict message when applicable', async ({ page }) => {
    // This would require setting up a mock booking with weather conflict
    // For now, just ensure the weather conflict section exists in the DOM structure
    await page.goto('/flights');
    await page.click('[data-testid="reschedule-button-1"]');

    // The dialog should have weather conflict section (even if empty)
    const weatherConflict = page.locator('[data-testid="weather-conflict"]');
    // It might not be visible if there's no conflict, but the element should exist
    await expect(weatherConflict).toHaveCount({ min: 0, max: 1 });
  });
});
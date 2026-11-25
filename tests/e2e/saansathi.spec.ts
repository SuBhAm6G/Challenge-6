import { expect, test, type BrowserContext } from '@playwright/test';

async function stubOpenMeteo(context: BrowserContext) {
  await context.route(/air-quality-api\.open-meteo\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        latitude: 28.625,
        longitude: 77.25,
        current: {
          time: new Date().toISOString(),
          pm2_5: 195,
          pm10: 310,
          carbon_monoxide: 1900,
          nitrogen_dioxide: 78,
          sulphur_dioxide: 16,
          ozone: 42,
          european_aqi: 95,
        },
        hourly: {
          time: Array.from({ length: 12 }, (_, i) =>
            new Date(Date.now() + i * 3600 * 1000).toISOString(),
          ),
          pm2_5: [195, 180, 160, 140, 130, 125, 140, 170, 200, 215, 220, 210],
          pm10: [310, 290, 250, 220, 210, 200, 220, 260, 300, 320, 330, 315],
          carbon_monoxide: Array(12).fill(1800),
          nitrogen_dioxide: Array(12).fill(72),
          sulphur_dioxide: Array(12).fill(14),
          ozone: Array(12).fill(45),
        },
      }),
    });
  });
}

test.describe('Saansathi End-to-End Workflows', () => {
  test('supports demo mode, location change, routine/indoor actions, choices/impact math, community checklist, and offline persistence', async ({
    page,
    context,
  }) => {
    await stubOpenMeteo(context);

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('New Delhi');
    await expect(page.getByText(/India NAQI/i).first()).toBeVisible();
    await expect(page.getByText(/Open-Meteo Air Quality/i).first()).toBeVisible();

    // 1. Toggle Sample Demo mode and verify explicit demo banner
    await page.getByRole('button', { name: /Load Sample Demo/i }).click();
    await expect(page.getByText(/SAMPLE DEMO DATA ACTIVE/i)).toBeVisible();
    await page.getByRole('button', { name: /Exit Sample Demo/i }).click();

    // 2. Manual Location Selector
    await page.getByRole('button', { name: /Change selected location/i }).click();
    await page.getByLabel(/Locality or neighbourhood/i).fill('Sector 62');
    await page.getByRole('button', { name: /Save & Use Location/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sector 62');

    // 3. Household Profile edit & persistence
    await page.getByRole('button', { name: /Family Context/i }).click();
    await page.getByLabel(/Household label/i).fill('Verma Household');
    await page.getByRole('button', { name: /Save Household Context/i }).click();
    await expect(page.getByText(/Verma Household/i)).toBeVisible();

    // 4. My Routine action completion
    await page.getByRole('button', { name: 'My Routine', exact: true }).click();
    await expect(page.getByRole('heading', { name: /My Household Daily Routine/i })).toBeVisible();
    await page.getByRole('button', { name: 'Complete' }).first().click();

    // 5. Indoor Air checklist
    await page.getByRole('button', { name: 'Indoor Air', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Indoor Air-Quality Toolkit/i })).toBeVisible();
    await page
      .getByRole('button', { name: /Check off/i })
      .first()
      .click();

    // 6. Better Choices & Impact calculation
    await page.getByRole('button', { name: 'Better Choices', exact: true }).click();
    await page.getByRole('button', { name: /Log This Weekly Shift to Impact/i }).click();
    await page.getByRole('button', { name: 'Impact', exact: true }).click();
    await expect(page.getByText(/1. Personal Exposure Management/i)).toBeVisible();
    await expect(page.getByText(/2. Illustrative Avoided Emissions/i)).toBeVisible();

    // 7. Community Workspace
    await page.getByRole('button', { name: 'Community', exact: true }).click();
    await page.getByLabel(/Action title/i).fill('Guard warm-gear distribution');
    await page.getByLabel(/Responsible role/i).fill('RWA Lead');
    await page.getByRole('button', { name: /Add to Community Checklist/i }).click();
    await expect(page.getByText('Guard warm-gear distribution')).toBeVisible();

    // 8. Assistant Offline/Fallback check
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Ask Saansathi', exact: true }).click();
    await page.getByRole('button', { name: 'What should my family prioritize today?' }).click();
    await expect(page.getByText(/Deterministic Offline Fallback/i)).toBeVisible();

    // 9. Reload persistence & reconnection
    await page.reload();
    await expect(page.getByText(/Offline mode/i)).toBeVisible();
    await expect(page.getByText(/Verma Household/i)).toBeVisible();

    await context.setOffline(false);
    await page.getByRole('button', { name: /Refresh air quality data/i }).click();
    await expect(page.getByText(/Verma Household/i)).toBeVisible();

    // 10. Keyboard accessibility check on primary skip link from top of page
    await page.reload();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /Skip to main content/i })).toBeFocused();
  });

  test('provides accessible data-table toggle for hourly chart and warns on active smog cycling trade-offs', async ({
    page,
    context,
  }) => {
    await stubOpenMeteo(context);
    await page.goto('/');
    await expect(page.getByText(/Today’s Hourly Outlook/i)).toBeVisible();

    await page.getByRole('button', { name: /View accessible data table/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Est. NAQI/i })).toBeVisible();

    await page.getByRole('button', { name: 'Better Choices', exact: true }).click();
    await page.getByLabel(/Alternative to evaluate/i).selectOption('bicycle');
    await expect(page.getByRole('alert')).toContainText(
      /Exposure vs\. Emission Trade-off Warning/i,
    );
  });

  test('supports mobile bottom navigation and urgent medical redirect offline guard', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubOpenMeteo(context);
    await page.goto('/');

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole('button', { name: 'Assistant' }).click();
    await expect(page.getByRole('heading', { name: /Ask Saansathi/i })).toBeVisible();

    await page
      .getByPlaceholder(/Ask about timing walks/i)
      .fill('My father has severe breathlessness and chest pain');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(page.getByText(/Medical Safety Redirect/i)).toBeVisible();
    await expect(page.getByText(/112 \/ 108/i)).toBeVisible();
  });
});

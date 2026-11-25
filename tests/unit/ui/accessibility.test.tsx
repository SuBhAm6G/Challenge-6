import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../../src/App.tsx';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { resetDbHandleForTests } from '../../../src/storage/db.ts';
import { useAppStore } from '../../../src/store/useAppStore.ts';

describe('Accessibility & Core UI Audit', () => {
  beforeEach(() => {
    resetDbHandleForTests();
    const sample = buildSampleWinterSmogBundle();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              latitude: 28.6,
              longitude: 77.2,
              current: {
                time: '2026-11-25T12:00',
                pm2_5: 190,
                pm10: 290,
                carbon_monoxide: 1800,
                nitrogen_dioxide: 75,
                sulphur_dioxide: 15,
                ozone: 42,
                european_aqi: 95,
              },
              hourly: {
                time: sample.forecast.hourly.slice(0, 6).map((h) => h.timestamp),
                pm2_5: [190, 175, 160, 140, 150, 180],
                pm10: [290, 270, 240, 210, 225, 260],
                carbon_monoxide: [1800, 1700, 1500, 1400, 1500, 1700],
                nitrogen_dioxide: [75, 70, 65, 55, 60, 72],
                sulphur_dioxide: [15, 14, 12, 11, 12, 14],
                ozone: [42, 46, 55, 62, 58, 45],
              },
            }),
            { status: 200 },
          ),
      ),
    );
  });

  it('renders semantic landmarks, skip link, and passes axe-core without critical or serious violations', async () => {
    const { container } = render(<App />);
    await screen.findByText(/Today’s Priority Actions/i);

    expect(screen.getByText(/Skip to main content/i)).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(useAppStore.getState().aqiResult.standard).toBe('INDIA_NAQI');

    const results = await axe.run(container, {
      rules: {
        // Color-contrast canvas checks in jsdom are limited; verify all structural & ARIA rules
        'color-contrast': { enabled: false },
      },
    });
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(seriousOrCritical).toEqual([]);
  });
});

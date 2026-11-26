import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../../src/App.tsx';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { resetDbHandleForTests } from '../../../src/storage/db.ts';
import { useAppStore } from '../../../src/store/useAppStore.ts';

function stubOpenMeteo() {
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
            },
            hourly: {
              time: sample.forecast.hourly.slice(0, 4).map((h) => h.timestamp),
              pm2_5: [190, 175, 160, 140],
              pm10: [290, 270, 240, 210],
              carbon_monoxide: [1800, 1700, 1500, 1400],
              nitrogen_dioxide: [75, 70, 65, 55],
              sulphur_dioxide: [15, 14, 12, 11],
              ozone: [42, 46, 55, 62],
            },
          }),
          { status: 200 },
        ),
    ),
  );
}

describe('App Root Onboarding, Connectivity & Route Navigation', () => {
  beforeEach(() => {
    resetDbHandleForTests();
    window.localStorage.clear();
    stubOpenMeteo();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-opens first-launch location modal once and remembers dismissal in localStorage', async () => {
    const { unmount } = render(<App />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue with Current/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.localStorage.getItem('saansathi_location_prompted')).toBe('1');
    unmount();

    // Second render must NOT auto-open LocationModal
    render(<App />);
    await screen.findByText(/Today’s Priority Actions/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tracks window offline/online events, header controls, and navigates across all 7 lazy routes', async () => {
    window.localStorage.setItem('saansathi_location_prompted', '1');
    render(<App />);
    await screen.findByText(/Today’s Priority Actions/i);

    fireEvent(window, new Event('offline'));
    expect(useAppStore.getState().isOnline).toBe(false);
    expect(screen.getByText(/Offline mode:/i)).toBeInTheDocument();

    fireEvent(window, new Event('online'));
    expect(useAppStore.getState().isOnline).toBe(true);

    // Header actions: Refresh, Sample Demo toggle, Location & Household modal openers
    fireEvent.click(screen.getByRole('button', { name: /Refresh air quality data/i }));
    fireEvent.click(screen.getByRole('button', { name: /Load Sample Demo/i }));
    expect(useAppStore.getState().isDemoMode).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Exit Sample Demo/i }));

    fireEvent.click(screen.getByRole('button', { name: /Change selected location/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save & Use Location/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Family Context/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save Household Context/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const routes: Array<[string, RegExp]> = [
      ['My Routine', /My Household Daily Routine/i],
      ['Indoor Air', /Indoor Air-Quality Toolkit/i],
      ['Better Choices', /Better Choices & Trade-Off Explorer/i],
      ['Impact', /Transparent Choice Impact Engine/i],
      ['Community', /Community Organizer Workspace/i],
      ['Ask Saansathi', /Ask Saansathi \(Contextual Assistant\)/i],
    ];
    for (const [btnName, heading] of routes) {
      fireEvent.click(screen.getAllByRole('button', { name: btnName })[0]!);
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    }
  });
});

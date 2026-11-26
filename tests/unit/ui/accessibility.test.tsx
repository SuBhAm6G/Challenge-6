import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../../src/App.tsx';
import { AssistantScreen } from '../../../src/components/assistant/AssistantScreen.tsx';
import { ChoicesScreen } from '../../../src/components/choices/ChoicesScreen.tsx';
import { CommunityScreen } from '../../../src/components/community/CommunityScreen.tsx';
import { HouseholdModal } from '../../../src/components/dashboard/HouseholdModal.tsx';
import { LocationModal } from '../../../src/components/dashboard/LocationModal.tsx';
import { ImpactScreen } from '../../../src/components/impact/ImpactScreen.tsx';
import { IndoorScreen } from '../../../src/components/indoor/IndoorScreen.tsx';
import { RoutineScreen } from '../../../src/components/routine/RoutineScreen.tsx';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';
import { interpretIndiaNAQI } from '../../../src/engines/aqi-interpreter.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import { resetDbHandleForTests } from '../../../src/storage/db.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_INDOOR_PROFILE,
} from '../../../src/store/defaults.ts';
import { useAppStore } from '../../../src/store/useAppStore.ts';

async function assertZeroAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom does not implement canvas text measurement; real contrast is verified in Playwright Chromium
      'color-contrast': { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe('Accessibility Audit Across All 7 Screens & Modals', () => {
  beforeEach(() => {
    resetDbHandleForTests();
    window.localStorage.setItem('saansathi_location_prompted', '1');
    const sample = buildSampleWinterSmogBundle();
    useAppStore.setState({
      hydrated: true,
      activeRoute: 'home',
      locationPresets: [DEFAULT_DEMO_LOCATION],
      selectedLocationId: DEFAULT_DEMO_LOCATION.id,
      currentReading: sample.current,
      forecast: sample.forecast,
      aqiResult: interpretIndiaNAQI(sample.current.pollutants),
      householdProfile: DEFAULT_DEMO_HOUSEHOLD,
      indoorProfile: DEFAULT_INDOOR_PROFILE,
      alertPreferences: DEFAULT_ALERT_PREFERENCES,
      routineStatuses: {},
      completedIndoorActionIds: [],
      impactHistory: [],
      communityPlan: DEFAULT_COMMUNITY_PLAN,
      isDemoMode: true,
    });
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
  });

  it('passes zero axe-core violations (all severities) on App shell and Home route', async () => {
    const { container } = render(<App />);
    await screen.findByText(/Today’s Priority Actions/i);

    expect(screen.getByText(/Skip to main content/i)).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Family Context/i })).toBeInTheDocument();
    expect(useAppStore.getState().aqiResult.standard).toBe('INDIA_NAQI');

    await assertZeroAxeViolations(container);
  });

  it('passes zero axe-core violations across Routine, Indoor, Choices, Impact, Community & Assistant screens', async () => {
    const screens = [
      <RoutineScreen key="routine" />,
      <IndoorScreen key="indoor" />,
      <ChoicesScreen key="choices" />,
      <ImpactScreen key="impact" />,
      <CommunityScreen key="community" />,
      <AssistantScreen key="assistant" />,
    ];

    for (const element of screens) {
      const { container, unmount } = render(element);
      await assertZeroAxeViolations(container);
      unmount();
    }

    // Verify table semantics on ImpactScreen
    const { unmount } = render(<ImpactScreen />);
    const headers = screen.getAllByRole('columnheader');
    for (const th of headers) {
      expect(th).toHaveAttribute('scope', 'col');
    }
    unmount();
  });

  it('passes zero axe-core violations on open LocationModal and HouseholdModal dialogs', async () => {
    const locRender = render(
      <LocationModal
        open={true}
        onOpenChange={vi.fn()}
        presets={[DEFAULT_DEMO_LOCATION]}
        selectedId={DEFAULT_DEMO_LOCATION.id}
        onSelect={vi.fn()}
        onSavePreset={vi.fn()}
        onDeletePreset={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Optional Browser Location/i }));
    await assertZeroAxeViolations(document.body);
    locRender.unmount();

    const houseRender = render(
      <HouseholdModal
        open={true}
        onOpenChange={vi.fn()}
        profile={DEFAULT_DEMO_HOUSEHOLD}
        onSave={vi.fn()}
        onResetAll={vi.fn()}
      />,
    );
    await assertZeroAxeViolations(document.body);
    houseRender.unmount();
  });
});

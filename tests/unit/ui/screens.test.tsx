import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantScreen } from '../../../src/components/assistant/AssistantScreen.tsx';
import { ChoicesScreen } from '../../../src/components/choices/ChoicesScreen.tsx';
import { CommunityScreen } from '../../../src/components/community/CommunityScreen.tsx';
import { HomeScreen } from '../../../src/components/dashboard/HomeScreen.tsx';
import { HourlyForecastChart } from '../../../src/components/dashboard/HourlyForecastChart.tsx';
import { ImpactScreen } from '../../../src/components/impact/ImpactScreen.tsx';
import { IndoorScreen } from '../../../src/components/indoor/IndoorScreen.tsx';
import { RoutineScreen } from '../../../src/components/routine/RoutineScreen.tsx';
import { interpretIndiaNAQI } from '../../../src/engines/aqi-interpreter.ts';
import { buildSampleWinterSmogBundle } from '../../../src/providers/sample-data.ts';
import {
  DEFAULT_ALERT_PREFERENCES,
  DEFAULT_COMMUNITY_PLAN,
  DEFAULT_DEMO_HOUSEHOLD,
  DEFAULT_DEMO_LOCATION,
  DEFAULT_INDOOR_PROFILE,
} from '../../../src/store/defaults.ts';
import { useAppStore } from '../../../src/store/useAppStore.ts';

describe('UI Screens & Accessible Visualizations', () => {
  beforeEach(() => {
    const { current, forecast } = buildSampleWinterSmogBundle();
    useAppStore.setState({
      hydrated: true,
      activeRoute: 'home',
      locationPresets: [DEFAULT_DEMO_LOCATION],
      selectedLocationId: DEFAULT_DEMO_LOCATION.id,
      currentReading: current,
      forecast,
      aqiResult: interpretIndiaNAQI(current.pollutants),
      householdProfile: DEFAULT_DEMO_HOUSEHOLD,
      indoorProfile: DEFAULT_INDOOR_PROFILE,
      alertPreferences: DEFAULT_ALERT_PREFERENCES,
      routineStatuses: {},
      completedIndoorActionIds: [],
      impactHistory: [],
      communityPlan: DEFAULT_COMMUNITY_PLAN,
      isDemoMode: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders HomeScreen with India NAQI card, alerts, routine preview, navigation shortcuts, and privacy strip', () => {
    render(<HomeScreen />);
    expect(screen.getByText('India NAQI')).toBeInTheDocument();
    expect(screen.getByText(/Today’s Priority Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Guarantee/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Full Timeline/i }));
    expect(useAppStore.getState().activeRoute).toBe('routine');
    fireEvent.click(screen.getByRole('button', { name: /Open Indoor Air Toolkit/i }));
    expect(useAppStore.getState().activeRoute).toBe('indoor');
    fireEvent.click(screen.getByRole('button', { name: /View Impact/i }));
    expect(useAppStore.getState().activeRoute).toBe('impact');
    fireEvent.click(screen.getByRole('button', { name: /Ask AI/i }));
    expect(useAppStore.getState().activeRoute).toBe('assistant');
  });

  it('toggles HourlyForecastChart between SVG visualization and accessible data table', () => {
    const { forecast } = buildSampleWinterSmogBundle();
    render(<HourlyForecastChart forecast={forecast} />);
    const toggleBtn = screen.getByRole('button', { name: /View accessible data table/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Est. NAQI' })).toBeInTheDocument();
  });

  it('allows toggling alerts and changing threshold category on HomeScreen', () => {
    render(<HomeScreen />);
    const select = screen.getByLabelText(/Alert threshold/i);
    fireEvent.change(select, { target: { value: 'Severe' } });
    expect(useAppStore.getState().alertPreferences.notifyOnCategoryAtOrAbove).toBe('Severe');

    fireEvent.click(screen.getByRole('button', { name: /Pause alerts/i }));
    expect(useAppStore.getState().alertPreferences.enabled).toBe(false);
  });

  it('submits a quick prompt in AssistantScreen and displays offline deterministic fallback', async () => {
    render(<AssistantScreen />);
    fireEvent.click(
      screen.getByRole('button', { name: 'What should my family prioritize today?' }),
    );
    expect(await screen.findByText(/Deterministic Offline Fallback/i)).toBeInTheDocument();
  });

  it('renders HourlyForecastChart unavailable message honestly when forecast is null', () => {
    render(<HourlyForecastChart forecast={null} />);
    expect(screen.getByText(/Hourly forecast data is currently unavailable/i)).toBeInTheDocument();
  });

  it('renders RoutineScreen and handles Accept, Complete, Dismiss, and Alternative toggles', async () => {
    render(<RoutineScreen />);
    expect(
      screen.getByRole('heading', { name: /My Household Daily Routine/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Accept:/i })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: /^Complete:/i })[0]!);

    const altBtn = screen.getAllByRole('button', { name: /Alternative/i })[0];
    expect(altBtn).toBeDefined();
    fireEvent.click(altBtn!);
    expect(screen.getByText(/Trade-off:/i)).toBeInTheDocument();
  });

  it('renders IndoorScreen with combustion safety warning and checks off indoor habits', async () => {
    render(<IndoorScreen />);
    expect(
      screen.getByRole('heading', { name: /Indoor Air-Quality Toolkit/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Never seal kitchens/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Ozone Generators/i)).toBeInTheDocument();

    const checkOffBtn = screen.getAllByRole('button', { name: /Check off/i })[0]!;
    fireEvent.click(checkOffBtn);
    expect(await screen.findByRole('button', { name: /^Checked:/i })).toBeInTheDocument();
  });

  it('shows active exposure conflict warning in ChoicesScreen when selecting cycling during high AQI', () => {
    render(<ChoicesScreen />);
    const select = screen.getByLabelText(/Alternative to evaluate/i);
    fireEvent.change(select, { target: { value: 'bicycle' } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Exposure vs\. Emission Trade-off Warning/i,
    );
  });

  it('recalculates and logs weekly commute shifts in ChoicesScreen', async () => {
    render(<ChoicesScreen />);
    fireEvent.change(screen.getByLabelText(/One-way trips shifted/i), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Log This Weekly Shift to Impact/i }));
    expect(await screen.findByText(/Logged to Impact/i)).toBeInTheDocument();
  });

  it('renders ImpactScreen separating Personal Exposure from Illustrative Avoided Emissions', () => {
    render(<ImpactScreen />);
    expect(screen.getByText(/1\. Personal Exposure Management/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Illustrative Avoided Emissions/i)).toBeInTheDocument();
    expect(screen.getByText(/Documented Indian Emission Factors Registry/i)).toBeInTheDocument();
  });

  it('renders CommunityScreen and adds a new community organizer checklist item', async () => {
    render(<CommunityScreen />);
    expect(
      screen.getByRole('heading', { name: /Community Organizer Workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Shareable Checklist/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Action title/i), {
      target: { value: 'Install gate air sensor board' },
    });
    fireEvent.change(screen.getByLabelText(/Responsible role/i), {
      target: { value: 'School Coordinator' },
    });
    fireEvent.change(screen.getByLabelText(/Suggested deadline/i), {
      target: { value: 'By Friday' },
    });
    fireEvent.change(screen.getByLabelText(/Why this helps/i), {
      target: { value: 'Alerts parents at drop-off' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add to Community Checklist/i }));
    expect(await screen.findByText('Install gate air sensor board')).toBeInTheDocument();
  });

  it('renders AssistantScreen with quick prompts below chat and privacy badge', () => {
    render(<AssistantScreen />);
    expect(screen.getByRole('heading', { name: /Ask Saansathi/i })).toBeInTheDocument();
    expect(screen.getByText(/City-level context only/i)).toBeInTheDocument();
    expect(screen.getByText(/Contextual Quick Prompts/i)).toBeInTheDocument();
    expect(screen.queryByText(/Inspect exact context/i)).not.toBeInTheDocument();
  });

  it('updates indoor cooking fuel, budget, purifier, and burning sources in IndoorScreen', () => {
    render(<IndoorScreen />);
    fireEvent.change(screen.getByLabelText(/Primary cooking fuel/i), {
      target: { value: 'electric_induction' },
    });
    expect(useAppStore.getState().indoorProfile.cookingFuel).toBe('electric_induction');

    fireEvent.change(screen.getByLabelText(/Improvement budget/i), {
      target: { value: 'moderate' },
    });
    expect(useAppStore.getState().indoorProfile.budget).toBe('moderate');

    fireEvent.click(screen.getByLabelText(/We have a HEPA air purifier/i));
    expect(useAppStore.getState().indoorProfile.hasAirPurifier).toBe(true);

    fireEvent.click(screen.getByRole('checkbox', { name: /Mosquito Coils/i }));
    expect(useAppStore.getState().indoorProfile.burningSources).toContain('mosquito_coils');
  });

  it('displays logged transport entries and non-zero cumulative savings in ImpactScreen', () => {
    useAppStore.setState({
      impactHistory: [
        {
          id: 'imp-test',
          dateIso: '2026-11-25T10:00:00.000Z',
          impactType: 'transport_emissions',
          title: 'Solo Petrol Car → Metro (18 km × 4/wk)',
          exposureNote: 'Separate from CO2e',
          co2eAvoidedKg: 9.79,
          vehicleTripsAvoided: 4,
          confidence: 'limited',
        },
      ],
    });
    render(<ImpactScreen />);
    expect(screen.getByText(/Solo Petrol Car → Metro/i)).toBeInTheDocument();
    expect(screen.getAllByText(/9\.79 kg CO₂e\/wk/i).length).toBeGreaterThanOrEqual(1);
  });

  it('updates community workspace name and action status in CommunityScreen', () => {
    render(<CommunityScreen />);
    const nameInput = screen.getByLabelText(/Community \/ School \/ Society name/i);
    fireEvent.change(nameInput, {
      target: { value: 'Green Park RWA' },
    });
    fireEvent.blur(nameInput);
    expect(useAppStore.getState().communityPlan.communityName).toBe('Green Park RWA');

    const firstStatusSelect = screen.getAllByLabelText(/Status for/i, { exact: false })[0]!;
    fireEvent.change(firstStatusSelect, { target: { value: 'in_progress' } });
    expect(useAppStore.getState().communityPlan.actions[0]?.status).toBe('in_progress');
  });

  it('renders validated groq_ai completion, safety warnings, and new-tab hints in AssistantScreen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              summary: 'Shift workouts indoors and run an ozone generator if needed.',
              recommendations: [
                {
                  id: 'rec-ai-1',
                  action: 'Keep bedrooms sealed with HEPA filtration',
                  timing: 'Morning & Night',
                  reason: 'PM2.5 peaks overnight.',
                  exposureConsideration: 'Lowers indoor exposure.',
                  environmentalConsideration: 'Low fan wattage.',
                  effort: 'low_effort',
                  confidence: 'high',
                  evidenceIds: ['cpcb-naqi'],
                  caveats: ['Open windows briefly when cooking on gas.'],
                },
              ],
              dataLimitations: ['Model estimate (~11 km)'],
              sourceIdsUsed: ['cpcb-naqi'],
              disclaimer: 'Environmental planning guidance only.',
            }),
            { status: 200 },
          ),
      ),
    );

    render(<AssistantScreen />);
    const input = screen.getByLabelText(/Ask Saansathi a question/i);
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled();

    fireEvent.change(input, { target: { value: 'How should we filter bedroom air?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByText(/AI-Assisted Explanation \(Validated\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Removed unsafe ozone-generator suggestion/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep bedrooms sealed with HEPA filtration/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\(opens in new tab\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('copies community checklist summary to clipboard and handles debounced community name writes', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    render(<CommunityScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Copy Shareable Checklist/i }));
    expect(await screen.findByRole('button', { name: /Summary Copied/i })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    const nameInput = screen.getByLabelText(/Community \/ School \/ Society name/i);
    fireEvent.change(nameInput, { target: { value: 'Vasant Kunj RWA' } });
    // Debounced: immediate store value has not updated yet
    expect(useAppStore.getState().communityPlan.communityName).not.toBe('Vasant Kunj RWA');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(useAppStore.getState().communityPlan.communityName).toBe('Vasant Kunj RWA');
  });

  it('navigates from ChoicesScreen to Impact via Inspect Impact Math', () => {
    render(<ChoicesScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Inspect Impact Math/i }));
    expect(useAppStore.getState().activeRoute).toBe('impact');
  });

  it('toggles HomeScreen Mark Done and RoutineScreen Dismiss with aria-pressed state', () => {
    render(<HomeScreen />);
    const markDoneBtns = screen.getAllByRole('button', { name: /^Mark Done:/i });
    expect(markDoneBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(markDoneBtns[0]!);
    expect(screen.getAllByRole('button', { name: /^Completed:/i })[0]).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    render(<RoutineScreen />);
    const dismissBtn = screen.getAllByRole('button', { name: /^Dismiss /i })[0]!;
    fireEvent.click(dismissBtn);
    expect(dismissBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

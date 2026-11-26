import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HouseholdModal } from '../../../src/components/dashboard/HouseholdModal.tsx';
import { LocationModal } from '../../../src/components/dashboard/LocationModal.tsx';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';

describe('LocationModal & HouseholdModal Workflows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows adding a custom locality preset and dismisses cleanly via Continue with Current', () => {
    const onSavePreset = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <LocationModal
        open={true}
        onOpenChange={onOpenChange}
        presets={[DEFAULT_DEMO_LOCATION]}
        selectedId={DEFAULT_DEMO_LOCATION.id}
        onSelect={vi.fn()}
        onSavePreset={onSavePreset}
        onDeletePreset={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^City$/i), { target: { value: 'kolkata' } });
    fireEvent.change(screen.getByLabelText(/Place tag/i), { target: { value: 'work' } });
    fireEvent.change(screen.getByLabelText(/Locality or neighbourhood/i), {
      target: { value: 'Rohini Sector 9' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Use Location/i }));

    expect(onSavePreset).toHaveBeenCalledTimes(1);
    expect(onSavePreset.mock.calls[0]?.[0]).toMatchObject({
      city: 'Kolkata',
      label: 'work',
      locality: 'Rohini Sector 9',
      precision: 'locality',
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue with Current/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles browser geolocation grant (~1 km rounding), denial, failure, and missing API', () => {
    const onSavePreset = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <LocationModal
        open={true}
        onOpenChange={onOpenChange}
        presets={[DEFAULT_DEMO_LOCATION]}
        selectedId={DEFAULT_DEMO_LOCATION.id}
        onSelect={vi.fn()}
        onSavePreset={onSavePreset}
        onDeletePreset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Optional Browser Location/i }));
    expect(
      screen.getByText(/Why we ask before accessing browser geolocation/i),
    ).toBeInTheDocument();

    // Case 1: unavailable geolocation API
    vi.stubGlobal('navigator', {});
    fireEvent.click(screen.getByRole('button', { name: /Allow Approximate Location/i }));
    expect(screen.getByText(/Browser geolocation is unavailable/i)).toBeInTheDocument();

    // Case 2: PERMISSION_DENIED error
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_ok: PositionCallback, err?: PositionErrorCallback) => {
          err?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
        },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Allow Approximate Location/i }));
    expect(screen.getByText(/Location permission declined/i)).toBeInTheDocument();

    // Case 3: generic geolocation timeout/unavailable error
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_ok: PositionCallback, err?: PositionErrorCallback) => {
          err?.({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError);
        },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Allow Approximate Location/i }));
    expect(screen.getByText(/Unable to determine browser location right now/i)).toBeInTheDocument();

    // Case 4: granted coordinates near Bengaluru, rounded to 0.01° (~1 km)
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) => {
          ok({
            coords: { latitude: 12.9749, longitude: 77.5964 },
          } as GeolocationPosition);
        },
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Allow Approximate Location/i }));
    expect(onSavePreset).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Bengaluru',
        latitude: 12.97,
        longitude: 77.6,
        precision: 'locality',
      }),
    );
  });

  it('updates household fields and refreshes draft when profile prop changes across openings', () => {
    const onSave = vi.fn();
    const onResetAll = vi.fn();
    const { rerender } = render(
      <HouseholdModal
        open={true}
        onOpenChange={vi.fn()}
        profile={DEFAULT_DEMO_HOUSEHOLD}
        onSave={onSave}
        onResetAll={onResetAll}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Household label/i), {
      target: { value: 'Nair Family' },
    });
    fireEvent.change(screen.getByLabelText(/Household size/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/One-way commute distance/i), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByLabelText(/Main commute mode/i), {
      target: { value: 'metro' },
    });
    fireEvent.change(screen.getByLabelText(/Work schedule/i), {
      target: { value: 'hybrid' },
    });
    fireEvent.change(screen.getByLabelText(/Outdoor exercise habit/i), {
      target: { value: 'evening_walk_run' },
    });
    fireEvent.change(screen.getByLabelText(/Budget for improvements/i), {
      target: { value: 'moderate' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Household Context/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nair Family',
        primaryCommuteMode: 'metro',
        workPattern: 'hybrid',
        outdoorExerciseHabit: 'evening_walk_run',
        budget: 'moderate',
        isDemo: false,
      }),
    );

    // Close and re-open with newly hydrated profile -> draft must not stay stale
    const hydratedProfile = {
      ...DEFAULT_DEMO_HOUSEHOLD,
      id: 'household-hydrated',
      name: 'Mehta Hydrated Family',
      updatedAt: '2026-11-26T09:00:00.000Z',
    };
    rerender(
      <HouseholdModal
        open={false}
        onOpenChange={vi.fn()}
        profile={hydratedProfile}
        onSave={onSave}
        onResetAll={onResetAll}
      />,
    );
    rerender(
      <HouseholdModal
        open={true}
        onOpenChange={vi.fn()}
        profile={hydratedProfile}
        onSave={onSave}
        onResetAll={onResetAll}
      />,
    );
    expect(screen.getByLabelText(/Household label/i)).toHaveValue('Mehta Hydrated Family');

    fireEvent.click(screen.getByRole('button', { name: /Delete & Reset Local Data/i }));
    expect(onResetAll).toHaveBeenCalledTimes(1);
  });

  it('selects and deletes saved location presets in LocationModal', () => {
    const onSelect = vi.fn();
    const onDeletePreset = vi.fn();
    const onOpenChange = vi.fn();
    const secondLoc = {
      ...DEFAULT_DEMO_LOCATION,
      id: 'loc-work',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      label: 'work' as const,
    };
    render(
      <LocationModal
        open={true}
        onOpenChange={onOpenChange}
        presets={[DEFAULT_DEMO_LOCATION, secondLoc]}
        selectedId={DEFAULT_DEMO_LOCATION.id}
        onSelect={onSelect}
        onSavePreset={vi.fn()}
        onDeletePreset={onDeletePreset}
      />,
    );

    fireEvent.click(screen.getByText(/Indiranagar, Bengaluru/i));
    expect(onSelect).toHaveBeenCalledWith('loc-work');

    fireEvent.click(screen.getByRole('button', { name: /Remove saved location Bengaluru/i }));
    expect(onDeletePreset).toHaveBeenCalledWith('loc-work');
  });

  it('toggles school-going children and vulnerability protection flags in HouseholdModal', () => {
    const onSave = vi.fn();
    render(
      <HouseholdModal
        open={true}
        onOpenChange={vi.fn()}
        profile={DEFAULT_DEMO_HOUSEHOLD}
        onSave={onSave}
        onResetAll={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Pregnant household member/i));
    fireEvent.click(screen.getByLabelText(/Include school commute/i));
    fireEvent.click(screen.getByRole('button', { name: /Save Household Context/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        hasSchoolGoingChildren: false,
        protectionFlags: expect.arrayContaining(['pregnant']),
      }),
    );
  });
});

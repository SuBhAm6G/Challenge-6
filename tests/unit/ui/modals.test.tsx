import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HouseholdModal } from '../../../src/components/dashboard/HouseholdModal.tsx';
import { LocationModal } from '../../../src/components/dashboard/LocationModal.tsx';
import { DEFAULT_DEMO_HOUSEHOLD, DEFAULT_DEMO_LOCATION } from '../../../src/data/cities.ts';

describe('LocationModal & HouseholdModal Workflows', () => {
  it('allows adding a custom locality preset in LocationModal and shows geolocation consent disclosure', () => {
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

    fireEvent.change(screen.getByLabelText(/Locality or neighbourhood/i), {
      target: { value: 'Rohini Sector 9' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Use Location/i }));

    expect(onSavePreset).toHaveBeenCalledTimes(1);
    expect(onSavePreset.mock.calls[0]?.[0]).toMatchObject({
      city: 'New Delhi',
      locality: 'Rohini Sector 9',
      precision: 'locality',
    });

    fireEvent.click(screen.getByRole('button', { name: /Optional Browser Location/i }));
    expect(
      screen.getByText(/Why we ask before accessing browser geolocation/i),
    ).toBeInTheDocument();
  });

  it('updates household name and triggers local reset action in HouseholdModal', () => {
    const onSave = vi.fn();
    const onResetAll = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <HouseholdModal
        open={true}
        onOpenChange={onOpenChange}
        profile={DEFAULT_DEMO_HOUSEHOLD}
        onSave={onSave}
        onResetAll={onResetAll}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Household label/i), {
      target: { value: 'Nair Family' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save Household Context/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nair Family', isDemo: false }),
    );

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

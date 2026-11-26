import { LocateFixed } from 'lucide-react';
import { useState } from 'react';
import { INDIAN_CITIES } from '../../data/cities.ts';
import {
  type LocationLabel,
  LocationLabelSchema,
  type LocationPreset,
} from '../../domain/household/types.ts';
import { parseEnumValue } from '../../domain/select-guards.ts';
import { AccessibleModal, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';
import { GeoConsentPanel } from './GeoConsentPanel.tsx';
import { SavedLocationsList } from './SavedLocationsList.tsx';

export function LocationModal({
  open,
  onOpenChange,
  presets,
  selectedId,
  onSelect,
  onSavePreset,
  onDeletePreset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: LocationPreset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSavePreset: (preset: LocationPreset) => void;
  onDeletePreset: (id: string) => void;
}) {
  const [cityId, setCityId] = useState<string>('delhi');
  const [locality, setLocality] = useState<string>('');
  const [label, setLabel] = useState<LocationLabel>('home');
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [showGeoConsent, setShowGeoConsent] = useState<boolean>(false);

  const selectedCity = INDIAN_CITIES.find((c) => c.id === cityId) ?? INDIAN_CITIES[0];

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) return;
    onSavePreset({
      id: `loc-${label}-${selectedCity.id}-${Date.now()}`,
      label,
      city: selectedCity.city,
      locality: locality.trim() || selectedCity.defaultLocality,
      state: selectedCity.state,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      precision: locality.trim() ? 'locality' : 'city',
    });
    setLocality('');
    onOpenChange(false);
  };

  const handleRequestGeolocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus(
        'Browser geolocation is unavailable on this device. Please select a city manually.',
      );
      return;
    }
    setGeoStatus('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const roundedLat = Math.round(pos.coords.latitude * 100) / 100;
        const roundedLon = Math.round(pos.coords.longitude * 100) / 100;
        const fallbackCity = INDIAN_CITIES[0];
        if (!fallbackCity) return;
        const nearest = INDIAN_CITIES.reduce((best, curr) => {
          const dCurr = Math.hypot(curr.latitude - roundedLat, curr.longitude - roundedLon);
          const dBest = Math.hypot(best.latitude - roundedLat, best.longitude - roundedLon);
          return dCurr < dBest ? curr : best;
        }, fallbackCity);

        onSavePreset({
          id: `loc-geo-${Date.now()}`,
          label,
          city: nearest.city,
          locality: `Near ${nearest.city} (~1 km grid)`,
          state: nearest.state,
          latitude: roundedLat,
          longitude: roundedLon,
          precision: 'locality',
        });
        setGeoStatus(null);
        setShowGeoConsent(false);
        onOpenChange(false);
      },
      (err) => {
        setGeoStatus(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission declined. Manual city selection works fully without GPS.'
            : 'Unable to determine browser location right now. Choose your city manually below.',
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  return (
    <AccessibleModal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Location & Saved Places"
      description="Coarse city or locality selection is enough. Exact coordinates are never shared in AI prompts or community plans."
    >
      <div className="space-y-5">
        <SavedLocationsList
          presets={presets}
          selectedId={selectedId}
          onSelect={(id) => {
            onSelect(id);
            onOpenChange(false);
          }}
          onDeletePreset={onDeletePreset}
        />

        <form
          onSubmit={handleSaveManual}
          className="border-border-warm bg-surface space-y-3 rounded-xl border p-4"
        >
          <h3 className="text-ink text-sm font-bold">Add city or neighbourhood manually</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-ink-body block text-xs font-semibold">
              City
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="border-border-strong bg-canvas text-ink mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                {INDIAN_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city} ({c.state})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-ink-body block text-xs font-semibold">
              Place tag
              <select
                value={label}
                onChange={(e) =>
                  setLabel(parseEnumValue(LocationLabelSchema, e.target.value, label))
                }
                className="border-border-strong bg-canvas text-ink mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                <option value="home">Home</option>
                <option value="work">Workplace</option>
                <option value="school">School</option>
                <option value="community">Community</option>
                <option value="custom">Other</option>
              </select>
            </label>
          </div>

          <label className="text-ink-body block text-xs font-semibold">
            Locality or neighbourhood (optional)
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder={selectedCity?.defaultLocality ?? 'e.g. Indiranagar or Sector 10'}
              maxLength={80}
              className="border-border-strong bg-canvas text-ink mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </label>

          {selectedCity && <p className="text-ink-muted text-xs">{selectedCity.winterSmogNote}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <PrimaryButton type="submit">Save & Use Location</PrimaryButton>
            <SecondaryButton type="button" onClick={() => setShowGeoConsent((v) => !v)}>
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Optional Browser Location
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => onOpenChange(false)}>
              Continue with Current
            </SecondaryButton>
          </div>

          {showGeoConsent && (
            <GeoConsentPanel
              geoStatus={geoStatus}
              onAllow={handleRequestGeolocation}
              onCancel={() => setShowGeoConsent(false)}
            />
          )}
        </form>
      </div>
    </AccessibleModal>
  );
}

import { LocateFixed, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { INDIAN_CITIES } from '../../data/cities.ts';
import type { LocationLabel, LocationPreset } from '../../domain/household/types.ts';
import { AccessibleModal, PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';

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
    const preset: LocationPreset = {
      id: `loc-${label}-${selectedCity.id}-${Date.now()}`,
      label,
      city: selectedCity.city,
      locality: locality.trim() || selectedCity.defaultLocality,
      state: selectedCity.state,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      precision: locality.trim() ? 'locality' : 'city',
    };
    onSavePreset(preset);
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
        // Round to ~1 km precision (2 decimal places) by default for privacy
        const roundedLat = Math.round(pos.coords.latitude * 100) / 100;
        const roundedLon = Math.round(pos.coords.longitude * 100) / 100;
        const nearest = INDIAN_CITIES.reduce((best, curr) => {
          const dCurr = Math.hypot(curr.latitude - roundedLat, curr.longitude - roundedLon);
          const dBest = Math.hypot(best.latitude - roundedLat, best.longitude - roundedLon);
          return dCurr < dBest ? curr : best;
        }, INDIAN_CITIES[0]!);

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
        <div>
          <h3 className="text-sm font-bold text-[#1C1917]">Saved locations</h3>
          <div className="mt-2 space-y-2">
            {presets.map((loc) => {
              const isSelected = loc.id === selectedId;
              return (
                <div
                  key={loc.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                    isSelected ? 'border-[#0F6E56] bg-emerald-50/70' : 'border-[#E4DCCD] bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(loc.id);
                      onOpenChange(false);
                    }}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[#0F6E56]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">
                        {loc.locality ? `${loc.locality}, ${loc.city}` : loc.city}
                      </p>
                      <p className="text-xs text-[#57534E] capitalize">
                        {loc.label} • {loc.precision} precision
                      </p>
                    </div>
                  </button>
                  {presets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeletePreset(loc.id)}
                      aria-label={`Remove saved location ${loc.city}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#57534E] hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleSaveManual}
          className="space-y-3 rounded-xl border border-[#E4DCCD] bg-white p-4"
        >
          <h3 className="text-sm font-bold text-[#1C1917]">Add city or neighbourhood manually</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#44403C]">
              City
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2.5 text-sm text-[#1C1917]"
              >
                {INDIAN_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city} ({c.state})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-[#44403C]">
              Place tag
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value as LocationLabel)}
                className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2.5 text-sm text-[#1C1917]"
              >
                <option value="home">Home</option>
                <option value="work">Workplace</option>
                <option value="school">School</option>
                <option value="community">Community</option>
                <option value="custom">Other</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#44403C]">
            Locality or neighbourhood (optional)
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder={selectedCity?.defaultLocality ?? 'e.g. Indiranagar or Sector 10'}
              maxLength={80}
              className="mt-1 w-full rounded-xl border border-[#D6CCBA] bg-[#FAF7F2] px-3 py-2.5 text-sm text-[#1C1917]"
            />
          </label>

          {selectedCity && <p className="text-xs text-[#57534E]">{selectedCity.winterSmogNote}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <PrimaryButton type="submit">Save & Use Location</PrimaryButton>
            <SecondaryButton type="button" onClick={() => setShowGeoConsent((v) => !v)}>
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Optional Browser Location
            </SecondaryButton>
          </div>

          {showGeoConsent && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              <p className="font-semibold">Why we ask before accessing browser geolocation:</p>
              <p className="mt-1">
                Coordinates are rounded to ~1 km only to fetch the local Open-Meteo model grid for
                your area and saved locally in your browser. Nothing is sent to AI prompts.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={handleRequestGeolocation}>
                  Allow Approximate Location
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => setShowGeoConsent(false)}>
                  Cancel
                </SecondaryButton>
              </div>
              {geoStatus && <p className="mt-2 font-medium">{geoStatus}</p>}
            </div>
          )}
        </form>
      </div>
    </AccessibleModal>
  );
}

import { PrimaryButton, SecondaryButton } from '../ui/Primitives.tsx';

export function GeoConsentPanel({
  geoStatus,
  onAllow,
  onCancel,
}: {
  geoStatus: string | null;
  onAllow: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
      <p className="font-semibold">Why we ask before accessing browser geolocation:</p>
      <p className="mt-1">
        Coordinates are rounded to ~1 km only to fetch the local Open-Meteo model grid for your area
        and saved locally in your browser. Nothing is sent to AI prompts.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={onAllow}>
          Allow Approximate Location
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
      {geoStatus && (
        <output aria-live="polite" className="mt-2 block font-medium">
          {geoStatus}
        </output>
      )}
    </div>
  );
}

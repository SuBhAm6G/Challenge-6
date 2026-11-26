import { MapPin, Trash2 } from 'lucide-react';
import type { LocationPreset } from '../../domain/household/types.ts';

export function SavedLocationsList({
  presets,
  selectedId,
  onSelect,
  onDeletePreset,
}: {
  presets: LocationPreset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDeletePreset: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-ink text-sm font-bold">Saved locations</h3>
      <div className="mt-2 space-y-2">
        {presets.map((loc) => {
          const isSelected = loc.id === selectedId;
          return (
            <div
              key={loc.id}
              className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                isSelected ? 'border-brand bg-emerald-50/70' : 'border-border-warm bg-surface'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(loc.id)}
                className="flex min-h-[44px] flex-1 items-center gap-2 text-left"
              >
                <MapPin className="text-brand h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-ink text-sm font-semibold">
                    {loc.locality ? `${loc.locality}, ${loc.city}` : loc.city}
                  </p>
                  <p className="text-ink-muted text-xs capitalize">
                    {loc.label} • {loc.precision} precision
                  </p>
                </div>
              </button>
              {presets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeletePreset(loc.id)}
                  aria-label={`Remove saved location ${loc.city}`}
                  className="text-ink-muted inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

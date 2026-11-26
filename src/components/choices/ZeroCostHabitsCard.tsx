import { Card } from '../ui/Primitives.tsx';

export function ZeroCostHabitsCard() {
  return (
    <Card>
      <h2 className="text-ink text-lg font-bold">Zero-Cost Low-Emission Daily Habits</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="border-border-warm bg-canvas rounded-xl border p-3.5 text-sm">
          <h3 className="text-ink font-bold">Stop idling at signals & gates</h3>
          <p className="text-ink-body mt-1 text-xs">
            Switching off engines for stops longer than 15–20 seconds cuts needless fuel burn and
            concentrated exhaust near pedestrians and school gates.
          </p>
        </div>
        <div className="border-border-warm bg-canvas rounded-xl border p-3.5 text-sm">
          <h3 className="text-ink font-bold">Consolidate cold-start errands</h3>
          <p className="text-ink-body mt-1 text-xs">
            Catalytic converters work poorly in the first few minutes of a cold engine. Batching 3
            short errands into 1 warm-engine loop saves fuel and tailpipe emissions.
          </p>
        </div>
        <div className="border-border-warm bg-canvas rounded-xl border p-3.5 text-sm">
          <h3 className="text-ink font-bold">Zero open waste or leaf burning</h3>
          <p className="text-ink-body mt-1 text-xs">
            Composting garden leaves and reporting municipal waste fires prevents intense local
            smoke spikes that travel directly into nearby homes.
          </p>
        </div>
      </div>
    </Card>
  );
}

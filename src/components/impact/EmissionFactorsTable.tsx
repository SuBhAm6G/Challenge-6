import { ExternalLink } from 'lucide-react';
import { INDIA_EMISSION_FACTORS } from '../../data/emission-factors.ts';
import { Card } from '../ui/Primitives.tsx';

export function EmissionFactorsTable() {
  return (
    <Card>
      <h2 className="text-ink text-lg font-bold">Documented Indian Emission Factors Registry</h2>
      <div className="border-border-warm mt-3 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Documented Indian transport emission factors registry
          </caption>
          <thead className="bg-subtle text-ink">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Mode
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                CO₂e (g/pkm)
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                PM2.5 (mg/pkm)
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                NOₓ (mg/pkm)
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Source & Year
              </th>
            </tr>
          </thead>
          <tbody className="divide-border-warm bg-surface divide-y">
            {INDIA_EMISSION_FACTORS.map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2 font-semibold">{f.label}</td>
                <td className="px-3 py-2">{f.co2eGramsPerPassengerKm}</td>
                <td className="px-3 py-2">{f.pm25MgPerPassengerKm ?? 'Omitted (varies)'}</td>
                <td className="px-3 py-2">{f.noxMgPerPassengerKm ?? 'Omitted (varies)'}</td>
                <td className="px-3 py-2">
                  <a
                    href={f.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand inline-flex items-center gap-1 underline"
                  >
                    {f.region} ({f.publicationYear})
                    <span className="sr-only"> (opens in new tab)</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

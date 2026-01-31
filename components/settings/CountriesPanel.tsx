import type { Country } from "../../types";

type CountriesPanelProps = {
  countries: Country[];
};

export default function CountriesPanel({ countries }: CountriesPanelProps) {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Países activos</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Configuración multi-país (solo vista).
      </p>
      <div className="mt-4 space-y-3">
        {countries.map((country) => (
          <div
            key={country.id}
            className="flex items-center justify-between rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3 text-sm text-botanical-800"
          >
            <span>{country.name}</span>
            <span className="text-xs font-semibold text-botanical-600">{country.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { LeadStatus } from "../../types";

type LeadFiltersProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: LeadStatus | "all";
  onStatusChange: (value: LeadStatus | "all") => void;
  countryValue: string | "all";
  onCountryChange: (value: string | "all") => void;
  countries: string[];
};

export default function LeadFilters({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  countryValue,
  onCountryChange,
  countries,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">
          Buscar lead
        </label>
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nombre o teléfono"
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">Estado</label>
        <select
          value={statusValue}
          onChange={(event) =>
            onStatusChange(event.target.value as LeadStatus | "all")
          }
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="all">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="seguimiento">En seguimiento</option>
          <option value="llamada">Llamada realizada</option>
          <option value="venta">Venta efectiva</option>
          <option value="no_interesado">No interesado</option>
          <option value="cerrado_tiempo">Cerrado por tiempo</option>
        </select>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-xs font-semibold text-botanical-700">País</label>
        <select
          value={countryValue}
          onChange={(event) => onCountryChange(event.target.value)}
          className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
        >
          <option value="all">Todos</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

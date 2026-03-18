import { useMemo, useState } from "react";

type ManualLeadFormProps = {
  countries: string[];
  onCreateLead: (payload: {
    nombre: string | null;
    telefono: string;
    pais: string;
    initialMessage?: string | null;
  }) => Promise<void>;
};

export default function ManualLeadForm({ countries, onCreateLead }: ManualLeadFormProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pais, setPais] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sortedCountries = useMemo(() => [...countries].sort((a, b) => a.localeCompare(b, "es")), [countries]);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!telefono.trim()) {
      setErrorMessage("El teléfono es obligatorio.");
      return;
    }

    if (!pais.trim()) {
      setErrorMessage("Selecciona un país.");
      return;
    }

    setIsSaving(true);
    try {
      await onCreateLead({
        nombre: nombre.trim() ? nombre.trim() : null,
        telefono: telefono.trim(),
        pais,
        initialMessage: initialMessage.trim() ? initialMessage.trim() : null,
      });
      setNombre("");
      setTelefono("");
      setInitialMessage("");
      setSuccessMessage("Lead creado correctamente para pruebas.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el lead manual.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">Alta manual</p>
      <p className="mt-1 text-sm text-botanical-600">
        Crea leads de prueba sin depender de Meta para validar el flujo completo.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-botanical-700">Nombre (opcional)</label>
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej: Carlos Pérez"
            className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-botanical-700">Teléfono</label>
          <input
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            placeholder="Ej: +573001112233"
            className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-botanical-700">País</label>
          <select
            value={pais}
            onChange={(event) => setPais(event.target.value)}
            className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          >
            <option value="">Seleccionar país</option>
            {sortedCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-xs font-semibold text-botanical-700">
            Mensaje inicial (opcional)
          </label>
          <textarea
            value={initialMessage}
            onChange={(event) => setInitialMessage(event.target.value)}
            rows={3}
            placeholder="Ej: Hola, quiero información del producto"
            className="w-full rounded-xl border border-botanical-100 px-3 py-2 text-sm text-botanical-800 focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-botanical-800 disabled:opacity-60"
          >
            {isSaving ? "Creando..." : "Crear lead"}
          </button>
        </div>
      </div>

      {errorMessage ? <p className="mt-3 text-xs text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-3 text-xs text-emerald-600">{successMessage}</p> : null}
    </div>
  );
}

type CampaignFormProps = {
  onSubmit: () => void;
};

export default function CampaignForm({ onSubmit }: CampaignFormProps) {
  return (
    <form
      className="space-y-4 rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
          Nueva campaña
        </p>
        <h3 className="mt-2 text-xl font-semibold text-botanical-900">
          Crear campaña masiva
        </h3>
      </div>

      <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
        Nombre de campaña
        <input
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          placeholder="Ej. Oferta de mantenimiento"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
        Segmento
        <input
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          placeholder="Ej. Leads activos Colombia"
        />
      </label>

      <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
        Plantilla
        <select className="rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100">
          <option>Bienvenida</option>
          <option>Seguimiento</option>
          <option>Garantía</option>
        </select>
      </label>

      <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
        Mensaje
        <textarea
          rows={4}
          className="rounded-xl border border-botanical-100 px-3 py-2 text-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-100"
          placeholder="Mensaje basado en plantilla"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-xl bg-botanical-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-botanical-800"
      >
        Guardar campaña
      </button>
    </form>
  );
}

export default function SettingsPlaceholder() {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Ajustes generales</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Sección preparada para configuraciones futuras.
      </p>
      <div className="mt-4 grid gap-3 text-sm text-botanical-700">
        <div className="rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3">
          Notificaciones internas (pendiente)
        </div>
        <div className="rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3">
          SLA por país (pendiente)
        </div>
        <div className="rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3">
          Automatizaciones comerciales (pendiente)
        </div>
      </div>
    </div>
  );
}

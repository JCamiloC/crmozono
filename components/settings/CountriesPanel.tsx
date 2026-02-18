"use client";

import { useMemo, useState } from "react";
import type { Country } from "../../types";

type CountriesPanelProps = {
  countries: Country[];
  onCreateCountry: (name: string, code: string) => Promise<void>;
  onUpdateCountry: (countryId: string, name: string, code: string) => Promise<void>;
  onDeleteCountry: (countryId: string) => Promise<void>;
};

const PAGE_SIZE = 6;

export default function CountriesPanel({
  countries,
  onCreateCountry,
  onUpdateCountry,
  onDeleteCountry,
}: CountriesPanelProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.code.toLowerCase().includes(normalizedQuery)
    );
  }, [countries, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCountries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedCountries = filteredCountries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleCreate = async () => {
    setErrorMessage(null);
    if (!name.trim() || !code.trim()) {
      setErrorMessage("Nombre y código son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await onCreateCountry(name, code);
      setName("");
      setCode("");
      setPage(1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo crear el país.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (country: Country) => {
    setEditingId(country.id);
    setEditName(country.name);
    setEditCode(country.code);
    setErrorMessage(null);
  };

  const handleSaveEdit = async (countryId: string) => {
    setUpdatingId(countryId);
    setErrorMessage(null);
    try {
      await onUpdateCountry(countryId, editName, editCode);
      setEditingId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el país.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (countryId: string) => {
    setDeletingId(countryId);
    setErrorMessage(null);
    try {
      await onDeleteCountry(countryId);
      if (editingId === countryId) {
        setEditingId(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el país.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Países activos</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Configuración multi-país.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_110px_auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del país"
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
        />
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="CO"
          maxLength={5}
          className="rounded-xl border border-botanical-200 px-3 py-2 text-sm uppercase text-botanical-800"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="rounded-xl bg-botanical-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </div>

      {errorMessage ? <p className="mt-2 text-xs text-rose-600">{errorMessage}</p> : null}

      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
        placeholder="Buscar país por nombre o código"
        className="mt-4 w-full rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
      />

      <div className="mt-4 space-y-3">
        {pagedCountries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-botanical-200 bg-botanical-50 px-4 py-3 text-sm text-botanical-700">
            No hay países para los filtros actuales.
          </div>
        ) : (
          pagedCountries.map((country) => {
            const isEditing = editingId === country.id;
            return (
              <div
                key={country.id}
                className="rounded-2xl border border-botanical-100 bg-botanical-50 px-4 py-3 text-sm text-botanical-800"
              >
                {isEditing ? (
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto_auto] sm:items-center">
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="rounded-xl border border-botanical-200 px-3 py-2 text-sm text-botanical-800"
                    />
                    <input
                      value={editCode}
                      onChange={(event) => setEditCode(event.target.value.toUpperCase())}
                      className="rounded-xl border border-botanical-200 px-3 py-2 text-sm uppercase text-botanical-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(country.id)}
                      disabled={updatingId === country.id}
                      className="rounded-xl bg-botanical-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
                    >
                      {updatingId === country.id ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-xl border border-botanical-300 bg-white px-3 py-2 text-xs font-semibold text-botanical-800"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-botanical-900">{country.name}</p>
                      <p className="text-xs font-semibold text-botanical-600">{country.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(country)}
                        className="rounded-lg border border-botanical-300 bg-white px-3 py-2 text-xs font-semibold text-botanical-800"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(country.id)}
                        disabled={deletingId === country.id}
                        className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
                      >
                        {deletingId === country.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-xs text-botanical-700">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

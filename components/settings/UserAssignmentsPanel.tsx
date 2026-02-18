"use client";

import { useEffect, useMemo, useState } from "react";
import type { Country, Role, UserAssignment } from "../../types";

type EditableAssignment = {
  role: Role;
  countryId: string | null;
};

type UserAssignmentsPanelProps = {
  countries: Country[];
  users: UserAssignment[];
  onSave: (userId: string, role: Role, countryId: string | null) => Promise<void>;
};

const roleOptions: Role[] = ["superadmin", "admin", "agente"];

export default function UserAssignmentsPanel({
  countries,
  users,
  onSave,
}: UserAssignmentsPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, EditableAssignment>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextDrafts = users.reduce<Record<string, EditableAssignment>>((accumulator, user) => {
      accumulator[user.id] = {
        role: user.role,
        countryId: user.countryId,
      };
      return accumulator;
    }, {});
    setDrafts(nextDrafts);
  }, [users]);

  const hasChanges = useMemo(() => {
    return users.some((user) => {
      const draft = drafts[user.id];
      if (!draft) {
        return false;
      }
      return draft.role !== user.role || draft.countryId !== user.countryId;
    });
  }, [drafts, users]);

  const handleSaveUser = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) {
      return;
    }

    setSavingUserId(userId);
    setErrorMessage(null);
    try {
      await onSave(userId, draft.role, draft.countryId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la asignación.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Asignación de usuarios por país</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Define el rol y país operativo de cada usuario para asignación automática de leads.
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-botanical-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-botanical-50 text-xs uppercase tracking-[0.08em] text-botanical-600">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-botanical-600" colSpan={4}>
                  No hay perfiles disponibles.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const draft = drafts[user.id] ?? {
                  role: user.role,
                  countryId: user.countryId,
                };

                return (
                  <tr key={user.id} className="border-t border-botanical-100">
                    <td className="px-4 py-3 text-botanical-800">
                      <p className="font-medium text-botanical-900">{user.email ?? user.id}</p>
                      <p className="text-xs text-botanical-600">ID: {user.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                        value={draft.role}
                        onChange={(event) => {
                          const role = event.target.value as Role;
                          setDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [user.id]: {
                              ...draft,
                              role,
                            },
                          }));
                        }}
                      >
                        {roleOptions.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
                        value={draft.countryId ?? ""}
                        onChange={(event) => {
                          const countryId = event.target.value || null;
                          setDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [user.id]: {
                              ...draft,
                              countryId,
                            },
                          }));
                        }}
                      >
                        <option value="">Sin país</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name} ({country.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSaveUser(user.id)}
                        className="rounded-lg bg-botanical-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 disabled:opacity-60"
                        disabled={savingUserId === user.id}
                      >
                        {savingUserId === user.id ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-botanical-600">
        {hasChanges
          ? "Hay cambios sin guardar en algunas filas."
          : "Todas las asignaciones están sincronizadas."}
      </p>
    </div>
  );
}
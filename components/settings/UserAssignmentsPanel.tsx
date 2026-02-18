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
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [orderValue, setOrderValue] = useState<"email_asc" | "email_desc" | "role">("email_asc");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 8;

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

  const processedUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filtered = users.filter((user) => {
      const emailValue = (user.email ?? "").toLowerCase();
      const countryValue = (user.countryName ?? "").toLowerCase();
      const searchMatch =
        !normalizedSearch ||
        emailValue.includes(normalizedSearch) ||
        countryValue.includes(normalizedSearch) ||
        user.id.toLowerCase().includes(normalizedSearch);
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      return searchMatch && roleMatch;
    });

    filtered.sort((a, b) => {
      if (orderValue === "email_desc") {
        return (b.email ?? b.id).localeCompare(a.email ?? a.id, "es");
      }

      if (orderValue === "role") {
        return a.role.localeCompare(b.role, "es");
      }

      return (a.email ?? a.id).localeCompare(b.email ?? b.id, "es");
    });

    return filtered;
  }, [users, searchValue, roleFilter, orderValue]);

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return processedUsers.slice(start, start + PAGE_SIZE);
  }, [processedUsers, safeCurrentPage]);

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

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar usuario o país"
          className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800 placeholder:text-botanical-400"
        />
        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value as Role | "all");
            setCurrentPage(1);
          }}
          className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
        >
          <option value="all">Todos los roles</option>
          {roleOptions.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
        <select
          value={orderValue}
          onChange={(event) => {
            setOrderValue(event.target.value as typeof orderValue);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-botanical-200 bg-white px-3 py-2 text-sm text-botanical-800"
        >
          <option value="email_asc">Usuario A-Z</option>
          <option value="email_desc">Usuario Z-A</option>
          <option value="role">Rol</option>
        </select>
      </div>

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
            {paginatedUsers.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-botanical-600" colSpan={4}>
                  No hay usuarios para los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
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

      {totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-botanical-700">
          <span>
            Página {safeCurrentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-lg border border-botanical-300 bg-white px-3 py-1.5 disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-botanical-600">
        {hasChanges
          ? "Hay cambios sin guardar en algunas filas."
          : "Todas las asignaciones están sincronizadas."}
      </p>
    </div>
  );
}
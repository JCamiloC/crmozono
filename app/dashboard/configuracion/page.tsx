"use client";

import { useEffect, useState } from "react";
import AuditPanel from "../../../components/settings/AuditPanel";
import CountriesPanel from "../../../components/settings/CountriesPanel";
import RolesPanel from "../../../components/settings/RolesPanel";
import SecurityPanel from "../../../components/settings/SecurityPanel";
import SettingsPlaceholder from "../../../components/settings/SettingsPlaceholder";
import UserAssignmentsPanel from "../../../components/settings/UserAssignmentsPanel";
import type {
  AuditLog,
  Country,
  Role,
  RoleSummary,
  SecuritySummary,
  UserAssignment,
} from "../../../types";
import { addAuditLog } from "../../../services/auditoria.service";
import { listAuditLogs } from "../../../services/auditoria.service";
import {
  getSecuritySummary,
  listCountries,
  listRoles,
  listUserAssignments,
  updateUserAssignment,
} from "../../../services/configuracion.service";

export default function ConfiguracionPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [users, setUsers] = useState<UserAssignment[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadConfigurationData = async () => {
    const [rolesData, countriesData, usersData, securityData, auditData] = await Promise.all([
      listRoles(),
      listCountries(),
      listUserAssignments(),
      getSecuritySummary(),
      listAuditLogs(),
    ]);
    setRoles(rolesData);
    setCountries(countriesData);
    setUsers(usersData);
    setSecuritySummary(securityData);
    setAuditLogs(auditData);
  };

  useEffect(() => {
    const load = async () => {
      await loadConfigurationData();
    };
    load();
  }, []);

  const handleSaveUserAssignment = async (
    userId: string,
    role: Role,
    countryId: string | null
  ) => {
    setErrorMessage(null);
    await updateUserAssignment(userId, role, countryId);

    const user = users.find((item) => item.id === userId);
    const selectedCountry = countries.find((country) => country.id === countryId);

    await addAuditLog(
      "lead_reassign",
      "profile",
      userId,
      `Asignación actualizada: rol=${role}, país=${selectedCountry?.code ?? "sin-país"}`,
      user?.email ?? "Superadmin"
    );

    await loadConfigurationData();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Configuración</h1>
        <p className="text-sm text-botanical-600">
          Ajustes generales, roles y países activos.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <RolesPanel roles={roles} />
        <CountriesPanel countries={countries} />
      </div>

      <UserAssignmentsPanel
        countries={countries}
        users={users}
        onSave={handleSaveUserAssignment}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SecurityPanel summary={securitySummary} />
        <SettingsPlaceholder />
      </div>

      <AuditPanel logs={auditLogs} />
    </div>
  );
}

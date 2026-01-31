"use client";

import { useEffect, useState } from "react";
import AuditPanel from "../../../components/settings/AuditPanel";
import CountriesPanel from "../../../components/settings/CountriesPanel";
import RolesPanel from "../../../components/settings/RolesPanel";
import SecurityPanel from "../../../components/settings/SecurityPanel";
import SettingsPlaceholder from "../../../components/settings/SettingsPlaceholder";
import type { AuditLog, Country, RoleSummary, SecuritySummary } from "../../../types";
import { listAuditLogs } from "../../../services/auditoria.service";
import {
  getSecuritySummary,
  listCountries,
  listRoles,
} from "../../../services/configuracion.service";

export default function ConfiguracionPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const load = async () => {
      const [rolesData, countriesData, securityData, auditData] = await Promise.all([
        listRoles(),
        listCountries(),
        getSecuritySummary(),
        listAuditLogs(),
      ]);
      setRoles(rolesData);
      setCountries(countriesData);
      setSecuritySummary(securityData);
      setAuditLogs(auditData);
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Configuración</h1>
        <p className="text-sm text-botanical-600">
          Ajustes generales, roles y países activos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <RolesPanel roles={roles} />
        <CountriesPanel countries={countries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SecurityPanel summary={securitySummary} />
        <SettingsPlaceholder />
      </div>

      <AuditPanel logs={auditLogs} />
    </div>
  );
}

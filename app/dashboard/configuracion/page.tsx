"use client";

import { useEffect, useState } from "react";
import AuditPanel from "../../../components/settings/AuditPanel";
import AutomationPanel from "../../../components/settings/AutomationPanel";
import CountriesPanel from "../../../components/settings/CountriesPanel";
import RolesPanel from "../../../components/settings/RolesPanel";
import SecurityPanel from "../../../components/settings/SecurityPanel";
import SettingsPlaceholder from "../../../components/settings/SettingsPlaceholder";
import SlaAutomationPanel from "../../../components/settings/SlaAutomationPanel";
import TemplateSettingsPanel from "../../../components/settings/TemplateSettingsPanel";
import UserAssignmentsPanel from "../../../components/settings/UserAssignmentsPanel";
import type {
  AuditLog,
  Country,
  MessageTemplate,
  Role,
  RoleSummary,
  SecuritySummary,
  UserAssignment,
} from "../../../types";
import { addAuditLog } from "../../../services/auditoria.service";
import { listAuditLogs } from "../../../services/auditoria.service";
import {
  deleteCountry,
  deleteMessageTemplateForConfig,
  getSlaCloseAutomationConfig,
  getNoResponseAutomationConfig,
  getSecuritySummary,
  createCountry,
  createMessageTemplateForConfig,
  listCountries,
  listMessageTemplatesForConfig,
  listRoles,
  listUserAssignments,
  runNoResponseAutomationNow,
  runSlaCloseAutomationNow,
  updateCountry,
  updateSlaCloseAutomationConfig,
  updateNoResponseAutomationConfig,
  updateMessageTemplateForConfig,
  updateUserAssignment,
} from "../../../services/configuracion.service";

export default function ConfiguracionPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [users, setUsers] = useState<UserAssignment[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [automationMinutes, setAutomationMinutes] = useState(10);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [automationSummary, setAutomationSummary] = useState<string | null>(null);
  const [slaEnabled, setSlaEnabled] = useState(true);
  const [slaDays, setSlaDays] = useState(5);
  const [savingSla, setSavingSla] = useState(false);
  const [runningSla, setRunningSla] = useState(false);
  const [slaSummary, setSlaSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadConfigurationData = async () => {
    const [
      rolesData,
      countriesData,
      usersData,
      securityData,
      auditData,
      templatesData,
      automationConfig,
      slaConfig,
    ] = await Promise.all([
      listRoles(),
      listCountries(),
      listUserAssignments(),
      getSecuritySummary(),
      listAuditLogs(),
      listMessageTemplatesForConfig(),
      getNoResponseAutomationConfig(),
      getSlaCloseAutomationConfig(),
    ]);
    setRoles(rolesData);
    setCountries(countriesData);
    setUsers(usersData);
    setSecuritySummary(securityData);
    setAuditLogs(auditData);
    setTemplates(templatesData);
    setAutomationEnabled(automationConfig.enabled);
    setAutomationMinutes(automationConfig.minutes);
    setSlaEnabled(slaConfig.enabled);
    setSlaDays(slaConfig.days);
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

  const handleCreateCountry = async (name: string, code: string) => {
    setErrorMessage(null);
    const country = await createCountry(name, code);
    await addAuditLog(
      "settings_updated",
      "country",
      country.id,
      `País creado: ${country.name} (${country.code})`,
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleUpdateCountry = async (countryId: string, name: string, code: string) => {
    setErrorMessage(null);
    const country = await updateCountry(countryId, { name, code });
    await addAuditLog(
      "settings_updated",
      "country",
      country.id,
      `País actualizado: ${country.name} (${country.code})`,
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleDeleteCountry = async (countryId: string) => {
    setErrorMessage(null);
    await deleteCountry(countryId);
    await addAuditLog(
      "settings_updated",
      "country",
      countryId,
      "País eliminado",
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleCreateTemplate = async (payload: {
    name: string;
    preview: string;
    body: string;
  }) => {
    setErrorMessage(null);
    const template = await createMessageTemplateForConfig(payload);
    await addAuditLog(
      "settings_updated",
      "message_template",
      template.id,
      `Plantilla creada: ${template.name}`,
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleSaveTemplate = async (
    templateId: string,
    payload: {
      name: string;
      preview: string;
      body: string;
      sendMode: "auto" | "text" | "template";
      providerTemplateName: string | null;
      providerLanguageCode: string | null;
      defaultVariables: Record<string, string>;
    }
  ) => {
    setErrorMessage(null);
    await updateMessageTemplateForConfig(templateId, payload);
    await addAuditLog(
      "settings_updated",
      "message_template",
      templateId,
      `Plantilla actualizada (${payload.sendMode})`,
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setErrorMessage(null);
    await deleteMessageTemplateForConfig(templateId);
    await addAuditLog(
      "settings_updated",
      "message_template",
      templateId,
      "Plantilla eliminada",
      "Superadmin"
    );
    await loadConfigurationData();
  };

  const handleSaveAutomationConfig = async () => {
    setErrorMessage(null);
    setAutomationSummary(null);
    setSavingAutomation(true);
    try {
      await updateNoResponseAutomationConfig({
        enabled: automationEnabled,
        minutes: automationMinutes,
      });
      await addAuditLog(
        "settings_updated",
        "automation",
        "no_response",
        `Automatización no respuesta: enabled=${automationEnabled}, minutes=${automationMinutes}`,
        "Superadmin"
      );
      setAutomationSummary("Configuración de automatización guardada.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar automatización.");
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleRunAutomationNow = async () => {
    setErrorMessage(null);
    setAutomationSummary(null);
    setRunningAutomation(true);
    try {
      const result = await runNoResponseAutomationNow();
      setAutomationSummary(
        `Ejecución lista: evaluados=${result.evaluatedLeads}, creados=${result.createdTasks}, omitidos=${result.skippedLeads}`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo ejecutar automatización.");
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleSaveSlaConfig = async () => {
    setErrorMessage(null);
    setSlaSummary(null);
    setSavingSla(true);
    try {
      await updateSlaCloseAutomationConfig({
        enabled: slaEnabled,
        days: slaDays,
      });
      await addAuditLog(
        "settings_updated",
        "automation",
        "sla_close",
        `Automatización SLA: enabled=${slaEnabled}, days=${slaDays}`,
        "Superadmin"
      );
      setSlaSummary("Configuración SLA guardada.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar SLA.");
    } finally {
      setSavingSla(false);
    }
  };

  const handleRunSlaNow = async () => {
    setErrorMessage(null);
    setSlaSummary(null);
    setRunningSla(true);
    try {
      const result = await runSlaCloseAutomationNow();
      setSlaSummary(
        `Ejecución SLA: evaluados=${result.evaluatedLeads}, cerrados=${result.closedLeads}, tareas canceladas=${result.canceledTasks}`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo ejecutar SLA.");
    } finally {
      setRunningSla(false);
    }
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
        <CountriesPanel
          countries={countries}
          onCreateCountry={handleCreateCountry}
          onUpdateCountry={handleUpdateCountry}
          onDeleteCountry={handleDeleteCountry}
        />
      </div>

      <TemplateSettingsPanel
        templates={templates}
        onCreateTemplate={handleCreateTemplate}
        onSaveTemplate={handleSaveTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <AutomationPanel
        enabled={automationEnabled}
        minutes={automationMinutes}
        saving={savingAutomation}
        running={runningAutomation}
        onEnabledChange={setAutomationEnabled}
        onMinutesChange={setAutomationMinutes}
        onSave={handleSaveAutomationConfig}
        onRunNow={handleRunAutomationNow}
        runSummary={automationSummary}
        errorMessage={null}
      />

      <SlaAutomationPanel
        enabled={slaEnabled}
        days={slaDays}
        saving={savingSla}
        running={runningSla}
        onEnabledChange={setSlaEnabled}
        onDaysChange={setSlaDays}
        onSave={handleSaveSlaConfig}
        onRunNow={handleRunSlaNow}
        runSummary={slaSummary}
        errorMessage={null}
      />

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

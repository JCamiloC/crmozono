"use client";

import { useEffect, useMemo, useState } from "react";
import { listAuditLogs } from "../../services/auditoria.service";
import { listCampaigns } from "../../services/campañas.service";
import { getSlaCloseAutomationConfig } from "../../services/configuracion.service";
import { listLeads } from "../../services/leads.service";
import { listCalls } from "../../services/llamadas.service";
import { listTasks } from "../../services/tareas.service";
import type { AuditLog, Campaign, Call, Lead, LeadStatus, Task } from "../../types";

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  seguimiento: "Seguimiento",
  llamada: "Llamada",
  venta: "Venta efectiva",
  no_interesado: "No interesado",
  cerrado_tiempo: "Cerrado por tiempo",
};

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const formatDateTime = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-botanical-900">{value}</p>
      <p className="mt-1 text-xs text-botanical-600">{subtitle}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [referenceNowMs, setReferenceNowMs] = useState(0);
  const [slaDays, setSlaDays] = useState(5);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [leadsData, tasksData, callsData, campaignsData, auditData, slaConfig] =
          await Promise.all([
            listLeads(),
            listTasks(),
            listCalls(),
            listCampaigns(),
            listAuditLogs(),
            getSlaCloseAutomationConfig(),
          ]);

        setLeads(leadsData);
        setTasks(tasksData);
        setCalls(callsData);
        setCampaigns(campaignsData);
        setAuditLogs(auditData);
        setSlaDays(slaConfig.days);
        setReferenceNowMs(Date.now());
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la información del dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setReferenceNowMs(Date.now());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const dashboardData = useMemo(() => {
    const safeNowMs = referenceNowMs;
    const totalLeads = leads.length;
    const totalSales = leads.filter((lead) => lead.estadoActual === "venta").length;

    const activeLeads = leads.filter(
      (lead) => lead.estadoActual !== "venta" && lead.estadoActual !== "cerrado_tiempo"
    ).length;

    const slaBreachedLeads = leads.filter((lead) => {
      const ageDays =
        (safeNowMs - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return (
        ageDays > slaDays &&
        lead.estadoActual !== "venta" &&
        lead.estadoActual !== "cerrado_tiempo"
      );
    }).length;

    const slaDueSoonLeads = leads.filter((lead) => {
      const ageDays =
        (safeNowMs - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return (
        ageDays >= slaDays - 1 &&
        ageDays <= slaDays &&
        lead.estadoActual !== "venta" &&
        lead.estadoActual !== "cerrado_tiempo"
      );
    }).length;

    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    const overdueTasks = tasks.filter((task) => {
      const dueAtMs = new Date(task.fechaProgramada).getTime();
      return task.estado === "vencida" || (task.estado === "pendiente" && dueAtMs < safeNowMs);
    }).length;

    const upcomingTasks = tasks
      .filter((task) => task.estado === "pendiente")
      .sort(
        (leftTask, rightTask) =>
          new Date(leftTask.fechaProgramada).getTime() -
          new Date(rightTask.fechaProgramada).getTime()
      )
      .slice(0, 6);

    const statusDistribution = Object.keys(STATUS_LABELS).map((statusKey) => {
      const status = statusKey as LeadStatus;
      const count = leads.filter((lead) => lead.estadoActual === status).length;
      return {
        status,
        label: STATUS_LABELS[status],
        count,
        percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0,
      };
    });

    const countryDistribution = Array.from(
      leads.reduce((accumulator, lead) => {
        accumulator.set(lead.pais, (accumulator.get(lead.pais) ?? 0) + 1);
        return accumulator;
      }, new Map<string, number>())
    )
      .map(([country, count]) => ({ country, count }))
      .sort((leftCountry, rightCountry) => rightCountry.count - leftCountry.count)
      .slice(0, 5);

    const effectiveCalls = calls.filter(
      (call) => call.result === "venta" || call.result === "interesado"
    ).length;
    const callEffectiveness = calls.length > 0 ? (effectiveCalls / calls.length) * 100 : 0;

    const runningCampaigns = campaigns.filter((campaign) => campaign.status === "running").length;
    const scheduledCampaigns = campaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const avgDeliveryRate =
      campaigns.length > 0
        ? campaigns.reduce((sum, campaign) => sum + campaign.deliveryRate, 0) /
          campaigns.length
        : 0;

    return {
      totalLeads,
      activeLeads,
      totalSales,
      conversionRate,
      slaDueSoonLeads,
      slaBreachedLeads,
      overdueTasks,
      callEffectiveness,
      runningCampaigns,
      scheduledCampaigns,
      avgDeliveryRate,
      statusDistribution,
      countryDistribution,
      upcomingTasks,
      recentAuditLogs: auditLogs.slice(0, 8),
    };
  }, [auditLogs, calls, campaigns, leads, referenceNowMs, slaDays, tasks]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-botanical-900">Dashboard operativo</h1>
        <p className="text-sm text-botanical-600">Cargando métricas comerciales...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-botanical-900">Dashboard operativo</h1>
        <p className="text-sm text-botanical-600">
          Vista ejecutiva de leads, seguimiento, SLA y actividad comercial.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Leads Totales"
          value={`${dashboardData.totalLeads}`}
          subtitle={`${dashboardData.activeLeads} en gestión activa`}
        />
        <KpiCard
          title="Conversión"
          value={formatPercent(dashboardData.conversionRate)}
          subtitle={`${dashboardData.totalSales} ventas efectivas`}
        />
        <KpiCard
          title="Alertas SLA"
          value={`${dashboardData.slaBreachedLeads}`}
          subtitle={`Leads con más de ${slaDays} días sin cierre`}
        />
        <KpiCard
          title="Tareas Vencidas"
          value={`${dashboardData.overdueTasks}`}
          subtitle="Requieren acción prioritaria"
        />
      </div>

      {(dashboardData.slaDueSoonLeads > 0 || dashboardData.slaBreachedLeads > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">SLA por vencer</p>
            <p>
              {dashboardData.slaDueSoonLeads} lead(s) están dentro de la ventana de 1 día para
              cierre SLA.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">SLA vencido</p>
            <p>{dashboardData.slaBreachedLeads} lead(s) superaron el SLA configurado.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-botanical-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">
            Pipeline de leads por estado
          </p>
          <div className="mt-4 space-y-3">
            {dashboardData.statusDistribution.map((item) => (
              <div key={item.status}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-botanical-800">{item.label}</span>
                  <span className="text-botanical-600">
                    {item.count} ({formatPercent(item.percentage)})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-botanical-100">
                  <div
                    className="h-2 rounded-full bg-botanical-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-botanical-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">
            Salud comercial
          </p>
          <div className="mt-4 space-y-3 text-sm text-botanical-700">
            <div className="flex items-center justify-between">
              <span>Efectividad llamadas</span>
              <span className="font-semibold text-botanical-900">
                {formatPercent(dashboardData.callEffectiveness)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Campañas activas</span>
              <span className="font-semibold text-botanical-900">
                {dashboardData.runningCampaigns}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Campañas programadas</span>
              <span className="font-semibold text-botanical-900">
                {dashboardData.scheduledCampaigns}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Entrega promedio campañas</span>
              <span className="font-semibold text-botanical-900">
                {formatPercent(dashboardData.avgDeliveryRate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-botanical-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">
            Próximas tareas de seguimiento
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-botanical-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-botanical-50 text-xs uppercase tracking-[0.08em] text-botanical-600">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.upcomingTasks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-botanical-600" colSpan={4}>
                      No hay tareas pendientes registradas.
                    </td>
                  </tr>
                ) : (
                  dashboardData.upcomingTasks.map((task) => (
                    <tr key={task.id} className="border-t border-botanical-100">
                      <td className="px-4 py-3 font-medium text-botanical-900">{task.leadNombre}</td>
                      <td className="px-4 py-3 text-botanical-700">{task.titulo}</td>
                      <td className="px-4 py-3 text-botanical-700">
                        {formatDateTime(task.fechaProgramada)}
                      </td>
                      <td className="px-4 py-3 text-botanical-700">{task.estado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-botanical-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">
            Distribución por país
          </p>
          <div className="mt-4 space-y-2">
            {dashboardData.countryDistribution.length === 0 ? (
              <p className="text-sm text-botanical-600">Sin leads registrados.</p>
            ) : (
              dashboardData.countryDistribution.map((item) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between rounded-lg bg-botanical-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-botanical-800">{item.country}</span>
                  <span className="font-semibold text-botanical-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-botanical-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-botanical-500">
          Actividad reciente (auditoría)
        </p>
        <div className="mt-4 space-y-2">
          {dashboardData.recentAuditLogs.length === 0 ? (
            <p className="text-sm text-botanical-600">Sin actividad registrada.</p>
          ) : (
            dashboardData.recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-botanical-100 bg-botanical-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-botanical-900">{log.summary}</p>
                <p className="mt-1 text-xs text-botanical-600">
                  {log.actor} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

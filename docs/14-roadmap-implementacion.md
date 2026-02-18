# 14-roadmap-implementacion.md

## Objetivo

Definir el orden de implementación de la lógica de negocio restante del CRM para cerrar producto con base en la documentación funcional existente.

---

## Fase 1 — Operación diaria (en curso)

- Dashboard operativo con métricas reales (leads, tareas, campañas, auditoría)
- Flujo base de recepción de mensajes por webhook
- Persistencia de mensajes, conversaciones y eventos webhook

Estado: **iniciada**

---

## Fase 2 — Automatizaciones comerciales

- Auto-creación o enriquecimiento de lead desde webhook (si teléfono no existe)
- Reglas de tarea automática por no respuesta
- Regla de SLA de 5 días con alerta y cierre por tiempo
- Alertas internas para tareas vencidas/próximas

Estado: en progreso

Implementado:

- Automatización manual de no respuesta (`/api/automations/no-response`) con runtime config en BD.
- Configuración en minutos (ideal pruebas 5-10 min) desde módulo Configuración.
- Creación automática de tarea `seguimiento_automatico` para leads en `contactado/seguimiento` sin respuesta inbound.
- Cierre automático por SLA configurable (`automations_sla_close_days`) con estado `cerrado_tiempo`.
- Cancelación automática de tareas pendientes al cerrar lead por SLA.
- Alertas internas UI para SLA por vencer/vencido y tareas por vencer/vencidas.

Pendiente de esta fase:

- Ejecución programada (cron) en producción (configurada en `vercel.json`, requiere deploy).
- Afinar notificaciones in-app/push (no solo alerta visual en vistas).

---

## Fase 3 — Capa de mensajería productiva

- Servicio de envío WhatsApp Cloud API real (token + phone number id)
- Registro de estados de entrega/lectura/fallo
- Reintentos controlados y trazabilidad de errores Meta
- Envío de plantillas según estado de lead

Estado: pendiente

---

## Fase 4 — Gobierno y trazabilidad

- Auditoría de acciones críticas ampliada
- Monitoreo de webhooks con reprocesamiento manual
- Reportes operativos mínimos por país/agente

Estado: pendiente

---

## Fase 5 — Seguridad final (hardening)

- Activación completa de RLS por rol y país
- Revisión de permisos mínimos en tablas sensibles
- Pruebas de acceso cruzado y validación de mínimo privilegio
- Checklist pre-producción final

Estado: pendiente (bloque final por decisión del proyecto)

---

## Criterios de cierre de implementación

- Webhook procesa mensajes entrantes y actualiza CRM de extremo a extremo
- Dashboard refleja métricas operativas con datos reales
- Flujos principales (lead, tarea, llamada, mensaje, campaña) sin mocks
- Seguridad RLS activada y probada antes de salida definitiva

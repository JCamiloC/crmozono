# Product Specification Document (PRD)

## 1. Product Name
CRM Ozono (crmozono)

## 2. Purpose
CRM web para equipos comerciales que gestionan leads, tareas, llamadas, mensajeria WhatsApp y campanas, con control por rol y por pais.

Objetivo principal:
- Convertir conversaciones en leads y leads en ventas.
- Dar visibilidad operativa y ejecutiva (dashboard KPI) a admins/superadmins.
- Mantener trazabilidad de acciones comerciales y estado del pipeline.

## 3. Users and Roles
- Superadmin:
  - Gestion global del sistema, configuracion y visibilidad total.
- Admin:
  - Gestion operativa de su dominio (principalmente por pais).
  - Asignaciones y supervision comercial.
- Agente:
  - Gestion diaria de su cartera: leads, mensajes, tareas y llamadas.

## 4. Core Functional Modules

### 4.1 Authentication and Session
- Inicio de sesion con Supabase Auth.
- Carga de perfil y rol para aplicar visibilidad funcional.

### 4.2 Leads Management
- Creacion manual de leads con pais.
- Estados del lead:
  - nuevo
  - contactado
  - seguimiento
  - llamada
  - venta
  - no_interesado
  - cerrado_tiempo
- Reglas de negocio:
  - No cerrar venta sin llamada registrada.
  - Estados finales bloquean acciones comerciales posteriores.
- Historial de estados por lead.
- Vista integral del lead (mensajes, tareas, llamadas en una sola pantalla).

### 4.3 Messaging (WhatsApp-centric)
- Listado de conversaciones activas.
- Hilo de mensajes inbound/outbound por conversacion.
- Envio de mensajes manuales y por plantilla.
- CTA para abrir lead desde conversacion.
- Auto-refresh de conversaciones y mensajes.
- Soporte de webhooks/eventos para trazabilidad.

### 4.4 Tasks
- Creacion de tareas por lead.
- Estados: pendiente, completada, vencida, cancelada.
- Regla de no duplicar tareas pendientes del mismo tipo para el mismo lead.
- Historial de cambios de estado de tarea.
- Alertas por vencimiento/proximidad.

### 4.5 Calls
- Registro de llamada por lead.
- Resultado de llamada:
  - venta
  - interesado
  - no_interesado
  - no_contesta
  - cortada
  - numero_incorrecto
- Uso de llamada para habilitar cierre comercial.

### 4.6 Campaigns
- Gestion de campanas masivas (modo operativo/simulado en UI).
- Seguimiento de logs por destinatario y estado de envio.

### 4.7 Configuration
- Gestion de roles, paises y asignaciones de usuario.
- Configuracion de plantillas de mensaje.
- Configuracion de automatizaciones (no respuesta, cierre por SLA).
- Panel de auditoria de acciones sensibles.

### 4.8 Dashboard
- KPI de conversion, SLA, tareas vencidas, salud operativa.
- Filtros por pais/agente/estado.
- Alertas operativas accionables.

## 5. Non-Functional Requirements
- Responsive (desktop y mobile).
- Trazabilidad (audit logs + historial de entidades).
- Consistencia de feedback UI (estados vacios, alertas y skeletons).
- Enfoque incremental sin RLS completo (con controles de scope en servicios).

## 6. Data Model Scope (High Level)
Tablas principales:
- profiles, roles, countries
- leads, lead_status_history
- conversations, messages, message_templates
- tasks, task_history
- calls
- campaigns, campaign_logs
- audit_logs
- webhook_events
- whatsapp_runtime_config

## 7. Key Business Flows

### 7.1 Message to Sale Flow
1. Llega o se crea interaccion de mensaje.
2. Conversacion visible en modulo Mensajes.
3. Conversacion ligada a lead.
4. Agente gestiona seguimiento (mensaje/tarea/llamada).
5. Se avanza estado del lead.
6. Cierre en venta (si cumple reglas).

### 7.2 SLA and Follow-up
1. Lead permanece en estados activos.
2. Se monitorea edad y vencimiento por SLA.
3. Se generan acciones de seguimiento y/o cierre por politica.

## 8. Acceptance Criteria for QA
- Se puede crear lead manual y queda visible en lista con estado inicial.
- Cada lead tiene conversacion asociada y permite intercambio de mensajes.
- No se permite cierre a venta sin llamada.
- Tareas cambian estado correctamente y registran historial.
- Visibilidad por rol/pais se respeta en listados de leads, mensajes, tareas y llamadas.
- Dashboard refleja KPIs y filtros sin errores.
- Configuracion permite editar paises/asignaciones/plantillas/automatizaciones.
- UI responsive sin desbordes en modulos principales.

## 9. Out of Scope (Current)
- Llamadas nativas por WhatsApp Cloud API.
- RLS completo de base de datos (se maneja por controles de servicio en esta etapa).

## 10. Tech Stack
- Next.js (App Router) + TypeScript
- Supabase (DB/Auth)
- Tailwind CSS
- Integraciones WhatsApp Cloud API (mensajeria/webhooks)

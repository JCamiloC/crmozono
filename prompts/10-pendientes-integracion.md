Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, SQL)
- CRMs de ventas multi-país
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 10

Completar todos los **pendientes vs docs** para dejar la aplicación funcional,
**excluyendo** integración real de WhatsApp API y RLS (solo preparar).

---

## ✅ ALCANCE (Pendientes vs docs)

### 1) Flujos funcionales

- Flujo Lead → Llamada → Estado final
- Validaciones de estado según /docs/05-estados-leads.md
- Bloqueo de cierre sin llamada registrada
- Historial visible en UI (leads y tareas)

### 2) Automatizaciones simuladas

- SLA por estado (5 días) con alertas visuales
- Cierre automático simulado por tiempo
- Tareas auto por inactividad (simulado)

### 3) Auditoría (simulada)

- Registrar acciones en UI:
  - Cambio de estado
  - Reasignación
  - Creación/cierre de tareas
  - Envíos masivos simulados

### 4) Validaciones UI

- Formularios con validaciones mínimas
- Estados vacíos (empty states)
- Mensajes de error controlados

---

## 🚫 WhatsApp API (NO integrar)

- NO llamar APIs reales
- NO crear webhooks
- SI preparar estructura para integrar:
  - Variables de entorno
  - Services con TODO
  - Tipos y contratos listos

---

## 🔒 RLS (NO integrar)

- NO implementar políticas RLS
- Solo documentar TODOs claros para fase final

---

## 📌 Resultado esperado

- Aplicación funcional completa vs docs (sin WhatsApp API ni RLS)
- Flujos y validaciones listas
- Preparado para integrar WhatsApp y RLS en la fase final

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

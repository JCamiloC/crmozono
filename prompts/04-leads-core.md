Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- CRMs de ventas
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 04

Implementar el **módulo de Leads (funcionalidad base)** siguiendo:
- /docs/04-leads.md
- /docs/05-estados-leads.md

---

## ✅ ALCANCE

### 1) Base de Datos (SQL)

Crear tablas mínimas para Leads y Estados:
- leads
- lead_status_history

Campos obligatorios según docs:
- Lead: id, nombre, telefono, pais, administrador_id, agente_id, estado_actual, fecha_estado, created_at, updated_at
- Historial: lead_id, estado, fecha, usuario_id

⚠️ RLS aún no complejo, pero dejar TODOs y documentación.

### 2) Servicios de Leads

En services/leads/ implementar funciones reales:
- listLeads()
- getLeadById()
- createLead()
- updateLeadStatus()
- assignLead()

Todas deben validar inputs mínimos y manejar errores explícitos.

### 3) UI (Integración)

Conectar la UI de /dashboard/leads a datos reales:
- Tabla de leads con datos mock (seed local o Supabase)
- Detalle de lead básico
- Cambio de estado (sin automatizaciones)

### 4) Tipos

Actualizar /types con campos reales de Lead y LeadStatus.

---

## 🔐 Seguridad

- NO exponer claves
- NO lógica crítica en UI
- TODOs claros para RLS

---

## 🚫 WhatsApp API (Aplazar)

- NO integrar WhatsApp Business API todavía
- NO crear webhooks ni envíos reales
- SI usar datos simulados para leads y “llamadas”
- Documentar claramente como TODO para fase final

---

## 📌 Resultado esperado

- CRUD básico de leads funcionando
- Estado actual visible
- Historial básico registrado
- Código limpio y documentado

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

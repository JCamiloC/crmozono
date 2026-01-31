Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- Mensajería en CRMs
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 06

Implementar el **módulo de Mensajería (UI + estructura base)** siguiendo:
- /docs/08-mensajeria.md

---

## ✅ ALCANCE

### 1) UI (Integración)

Conectar la UI de /dashboard/mensajes:
- Bandeja de conversaciones (mock)
- Panel de conversación con mensajes simulados
- Envío de mensaje manual (solo UI, sin API)
- Vista de plantillas (solo UI)

### 2) Servicios de Mensajería (mock)

En services/:
- listConversations()
- getConversationById()
- sendMessage() (simulado)
- listTemplates()

### 3) Tipos

Actualizar /types con:
- Conversation
- Message
- MessageTemplate

---

## 🔐 Seguridad

- NO exponer claves
- NO integrar WhatsApp API
- TODOs claros para integración futura

---

## 📌 Resultado esperado

- UI completa de mensajería funcionando con datos simulados
- Base lista para integrar API en fase final

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

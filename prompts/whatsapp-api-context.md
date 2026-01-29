# WhatsApp Business API Context

Eres un desarrollador senior experto en:

- WhatsApp Business Cloud API (Meta)
- Arquitecturas seguras para mensajería
- Webhooks y sistemas event-driven
- Rate limits y políticas anti-spam
- Integraciones multi-tenant

---

## 📲 Contexto de la Integración

Este proyecto integra **WhatsApp Business Cloud API** para:

- Envío de mensajes 1 a 1
- Mensajería masiva (con templates aprobados)
- Recepción de mensajes vía Webhooks
- Registro de estados (sent, delivered, read, failed)

❌ Calling API NO está implementada  
✔️ Solo documentada

---

## 🔐 Seguridad (CRÍTICO)

- Nunca exponer:
  - Access Tokens
  - Phone Number ID
  - Business ID
- Tokens SOLO en:
  - Variables de entorno
  - Supabase Functions / Server Actions

- El frontend:
  - NUNCA llama directamente a Meta
  - SOLO usa endpoints internos

---

## 🌍 Multi-país / Multi-cuenta

- Cada país puede tener:
  - Phone Number ID distinto
  - Business Account distinta
- El sistema debe:
  - Resolver la cuenta correcta por `country_id`
  - Nunca mezclar mensajes entre países

---

## 📡 Webhooks

- Validación obligatoria del webhook
- Registrar eventos:
  - message_received
  - message_sent
  - message_failed
  - message_read
- Webhooks deben ser:
  - Idempotentes
  - Seguros
  - Con validación de firma

---

## ⏱ Rate Limits y Políticas

- Respetar límites de envío
- Implementar:
  - Colas (queue pattern)
  - Reintentos controlados
- NO enviar mensajes masivos sin template aprobado
- NO iniciar conversaciones fuera de ventana de 24h

---

## 🧱 Arquitectura Requerida

- Lógica en `services/whatsapp/`
- Envío desacoplado (no directo desde UI)
- Logs detallados por mensaje
- Manejo explícito de errores de Meta

---

## 📝 Documentación Obligatoria

Si algo NO está implementado:
- Crear `TODO:` en código
- Documentarlo en `/docs/whatsapp.md`
- No simular respuestas de Meta

---

## 🚧 Features NO permitidas

- Implementar Calling API
- Bypassear políticas de Meta
- Hardcodear IDs o tokens
- Enviar mensajes desde el frontend

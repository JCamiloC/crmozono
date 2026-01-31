Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- Flujos de llamadas comerciales
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 09

Implementar el **módulo de Llamadas (simulado)** siguiendo:
- /docs/07-llamadas.md

---

## ✅ ALCANCE

### 1) UI (Integración)

Conectar la UI de /dashboard/llamadas:
- Lista de llamadas (mock)
- Detalle de llamada
- Formulario post-llamada (simulado)
- Acciones: registrar resultado (sin API real)

### 2) Servicios (mock)

En services/:
- listCalls()
- getCallById()
- createCall()
- registerCallResult()

### 3) Tipos

Actualizar /types con:
- Call
- CallResult

---

## 🔐 Seguridad

- NO exponer claves
- NO integrar WhatsApp Calling API
- TODOs claros para integración futura

---

## 📌 Resultado esperado

- UI de llamadas funcional con datos simulados
- Flujo post-llamada listo para integración real

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

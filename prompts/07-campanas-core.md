Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- Campañas masivas en CRMs
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 07

Implementar el **módulo de Campañas Masivas (UI + estructura base)** siguiendo:
- /docs/09-campanas-masivas.md

---

## ✅ ALCANCE

### 1) UI (Integración)

Conectar la UI de /dashboard/campanas:
- Listado de campañas (mock)
- Estado de campaña y métricas básicas
- Formulario para crear campaña (solo UI)
- Vista de logs por campaña (simulado)

### 2) Servicios de Campañas (mock)

En services/:
- listCampaigns()
- getCampaignById()
- createCampaign() (simulado)
- listCampaignLogs()

### 3) Tipos

Actualizar /types con:
- Campaign
- CampaignLog

---

## 🔐 Seguridad

- NO exponer claves
- NO integrar envíos reales aún
- TODOs claros para integración futura

---

## 📌 Resultado esperado

- UI completa de campañas funcionando con datos simulados
- Base lista para integrar envíos reales en fase final

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

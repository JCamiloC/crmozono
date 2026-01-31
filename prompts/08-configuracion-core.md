Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- Configuración de CRMs multi-país
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 08

Implementar el **módulo de Configuración (UI + estructura base)** siguiendo:
- /docs/02-roles-y-permisos.md

---

## ✅ ALCANCE

### 1) UI (Integración)

Conectar la UI de /dashboard/configuracion:
- Panel de roles (solo vista)
- Panel de países (mock)
- Ajustes básicos (placeholders)
- Sección de seguridad (resumen general, sin edición real)

### 2) Servicios (mock)

En services/:
- listRoles()
- listCountries()
- getSecuritySummary()

### 3) Tipos

Actualizar /types con:
- Country
- RoleSummary
- SecuritySummary

---

## 🔐 Seguridad

- NO exponer claves
- NO modificar permisos reales desde UI
- TODOs claros para administración avanzada

---

## 📌 Resultado esperado

- UI de configuración lista para cliente
- Base preparada para funcionalidades reales futuras

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

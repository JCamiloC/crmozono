Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL, Edge Functions)
- Arquitectura Serverless
- CRMs de ventas multi-país
- Dashboards empresariales escalables

Este proyecto es un CRM de ventas con WhatsApp Business API.
NO es un MVP rápido, es una base sólida y extensible.

---

## 📌 CONTEXTO GLOBAL

- Toda la documentación funcional y técnica está en `/docs`
- NO asumas flujos ni reglas fuera de la documentación
- Si algo no está implementado:
  - Crear placeholder
  - Marcar como TODO
  - Referenciar el archivo correspondiente en `/docs`

Antes de escribir código:
1. Analiza la estructura del proyecto
2. Lee `/docs` para entender el flujo completo del sistema
3. Revisa `/types` si existen
4. Define una arquitectura limpia y escalable

---

## 🎯 OBJETIVO DE ESTA IMPLEMENTACIÓN

Construir **EL ESQUELETO COMPLETO DEL DASHBOARD**, incluyendo:

- Layout general
- Navegación
- Protección por roles
- Estructura de carpetas
- Servicios base
- Tipos base
- Páginas placeholder
- Middleware de autenticación

⚠️ NO implementar lógica compleja aún  
⚠️ NO conectar WhatsApp API todavía  
⚠️ NO escribir SQL avanzado todavía  

Esta fase es SOLO estructura.

---

## 🧱 ALCANCE DE LA IMPLEMENTACIÓN

### 1️⃣ Autenticación
- Integrar Supabase Auth
- Middleware de protección de rutas
- Redirección según rol
- NO hardcodear roles

---

### 2️⃣ Layout del Dashboard

Crear layout principal con:
- Sidebar
- Header
- Contenedor de contenido
- Soporte multi-país (sin lógica aún)

Rutas base:
- `/dashboard`
- `/dashboard/leads`
- `/dashboard/tareas`
- `/dashboard/mensajes`
- `/dashboard/campanas`
- `/dashboard/configuracion`

---

### 3️⃣ Estructura de Carpetas

Crear estructura clara:

- `/app`
- `/app/dashboard`
- `/components/layout`
- `/components/ui`
- `/services`
- `/services/auth`
- `/services/leads`
- `/services/tasks`
- `/types`
- `/docs`

Cada carpeta debe tener:
- README.md corto explicando su propósito

---

### 4️⃣ Servicios (sin lógica)

Crear servicios base con funciones vacías:

- auth.service.ts
- leads.service.ts
- tasks.service.ts

Las funciones deben:
- Tener firma clara
- Comentarios explicativos
- Referenciar docs relacionados

---

### 5️⃣ Tipos Base

Definir tipos iniciales:

- User
- Role
- Lead
- Task

⚠️ Los tipos NO deben contener lógica

---

### 6️⃣ Páginas Placeholder

Cada página debe:
- Renderizar layout
- Mostrar título
- Indicar “pendiente de implementación”
- Referenciar el doc correspondiente

Ejemplo:
"Este módulo se implementará según /docs/04-leads.md"

---

### 7️⃣ Reglas Obligatorias

- NO exponer claves en frontend
- NO lógica de negocio en componentes
- NO llamadas directas a Supabase desde UI
- Usar siempre services/
- Código limpio y comentado
- Pensar siempre en multi-país y multi-rol

---

## 🧠 EXPECTATIVA FINAL

Al terminar:
- El proyecto debe compilar sin errores
- El dashboard debe navegar completo
- Todo debe estar listo para empezar feature por feature
- La estructura debe permitir escalar sin refactor masivo

Si algo no está claro:
- NO improvises
- Documenta
- Marca TODO
- Continúa con la estructura

Comienza por analizar la arquitectura y luego genera el código.

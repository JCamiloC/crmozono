# 16-mapeo-entrega-funcional.md

## Objetivo

Dejar **únicamente lo que falta** para validar entrega funcional con cliente, según estado real del repositorio al 2026-02-18.

> Este documento excluye trabajo ya completado (CRUD países/plantillas, guard y menú por rol en UI, buscador/orden/paginación en módulos clave, automatizaciones base y alertas).

---

## 1) Pendientes bloqueantes para prueba cliente

## 1.1 Seguridad de backend (crítico)

Aunque la UI ya filtra por rol, aún faltan controles server-side para cumplir lineamiento de “nunca confiar en frontend”:

- Proteger acciones sensibles desde backend/API con validación explícita de sesión + rol + país.
- Evitar que usuario autenticado llame endpoints sensibles sin autorización de rol.
- En particular, endurecer:
  - `app/api/automations/no-response/route.ts` (`POST` hoy ejecuta sin validar token/rol)
  - `app/api/whatsapp/messages/route.ts` (no valida rol/country scope)
  - operaciones de configuración hechas desde cliente sin control de rol en backend.

### Criterio de aceptación

- Agente no puede ejecutar automatizaciones ni cambios administrativos vía request directa.
- Admin solo opera datos de su país.
- Superadmin conserva acceso global.

---

## 1.2 Scope por país/rol en datos (sin RLS aún)

Servicios actuales leen/escriben datos globales en varias consultas (`listLeads`, `listTasks`, `listCalls`, etc.) y dependen de UX para restringir vistas.

### Pendiente

- Implementar capa temporal de autorización por perfil (hasta activar RLS):
  - filtro por `country_id` para admin/agente.
  - filtro por asignación (`agente_id`) cuando aplique.
- Bloquear update/delete fuera de scope de país/rol.

### Criterio de aceptación

- Cambiando de usuario, cada rol ve y modifica solo su dominio permitido, incluso forzando requests manuales.

---

## 1.3 Flujo de campañas aún “operativo parcial”

El módulo existe y persiste datos, pero la ejecución comercial sigue descrita como simulada en UI.

### Pendiente

- Definir y cerrar operación mínima real de campañas para entrega:
  - disparo controlado de campaña.
  - trazabilidad por lote (enviado/fallido/bloqueado) y resumen consistente.
  - reglas de pausa/reanudación y retry básico.

### Criterio de aceptación

- Una campaña puede pasar de preparación a ejecución con resultados verificables en logs y auditoría.

---

## 2) Pendientes importantes (no bloquean demo inicial, sí cierre formal)

## 2.1 Gestión de usuarios para operación diaria

Actualmente se puede reasignar rol/país a perfiles existentes, pero no hay flujo administrativo completo de ciclo de vida.

### Pendiente

- Definir flujo mínimo para alta/baja operativa de usuarios (invitación/activación/desactivación).
- Registrar auditoría de estas acciones.

---

## 2.2 Coherencia de experiencia y mensajes en UI

Persisten textos de “simulado/pendiente” que pueden generar ruido durante UAT con cliente.

### Pendiente

- Ajustar etiquetas y textos en módulos que ya usan datos reales para evitar contradicción funcional.
- Mantener “simulado” solo donde la capacidad no está realmente cerrada.

---

## 2.3 Redirección inicial por rol en capa de borde

Existe TODO explícito en `proxy.ts` para redirección por rol al entrar por `/login` con sesión activa.

### Pendiente

- Resolver redirección por rol en `proxy.ts` para consistencia con navegación actual.

---

## 2.4 Cierre documental de release

Hay documentación técnica parcial, pero falta un cierre unificado orientado a operación cliente.

### Pendiente

- Consolidar checklist único de go-live:
  - migraciones SQL obligatorias por entorno.
  - variables requeridas (`.env`, Vercel, cron/token).
  - rollback mínimo.
  - smoke test por rol (superadmin/admin/agente).

---

## 3) Fase posterior obligatoria (hardening)

## 3.1 RLS completa en Supabase

RLS sigue pendiente y es requisito de seguridad final antes de producción expuesta.

### Pendiente

- Activar políticas por rol/país en tablas sensibles.
- Validar accesos cruzados y mínimo privilegio.

---

## 4) Orden recomendado de cierre desde hoy

1. Endurecer backend (autorización por rol/país en APIs y operaciones sensibles).
2. Cerrar scope de datos sin RLS (filtros y bloqueos por perfil en servicios actuales).
3. Completar operación mínima real de campañas.
4. Limpiar mensajes “simulado/pendiente” para UAT.
5. Publicar checklist único de release + ejecutar prueba E2E por rol.
6. Activar RLS (fase hardening final).

---

## 5) Definición de “lista para prueba integral cliente”

Se considera lista para prueba cuando:

- No se pueden ejecutar acciones administrativas fuera de rol/país desde requests manuales.
- Flujos de leads, tareas, llamadas, mensajes y campañas se ejecutan sin contradicciones de estado.
- Configuración y automatizaciones quedan trazables en auditoría.
- Existe checklist operativo único para despliegue y validación post-deploy.

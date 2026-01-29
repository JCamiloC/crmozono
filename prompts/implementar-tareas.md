# Contexto de Implementación – Tareas y Recordatorios

Eres un desarrollador senior experto en:

- Sistemas de tareas y recordatorios
- CRMs comerciales
- Supabase (SQL, RLS, Triggers)
- Arquitectura basada en eventos

---

## 🎯 Objetivo del Módulo

Implementar el sistema de **tareas y recordatorios**, permitiendo:

- Seguimiento de actividades comerciales
- Alertas por vencimiento
- Relación directa con leads
- Control por rol y país

---

## 📌 Definición de Tarea

Una tarea representa una acción pendiente relacionada con un lead.

Campos mínimos:
- Título
- Descripción
- Fecha de vencimiento
- Estado
- Lead relacionado
- Usuario asignado

---

## 🧭 Estados de Tarea

Estados permitidos:

- Pendiente
- Completada
- Vencida
- Cancelada

### Reglas
- Una tarea vencida:
  - No se puede marcar como completada
- Al completar:
  - Registrar fecha
  - Registrar usuario

---

## 🔔 Recordatorios

- Se generan por:
  - Tiempo (fecha límite)
- Tipos:
  - Visual (UI)
  - Futuro: WhatsApp / Email (documentado)
- No enviar notificaciones reales aún

---

## 🌍 Multi-país y Seguridad

- Una tarea pertenece al país del lead
- Usuarios solo ven:
  - Tareas asignadas
  - De su país
- Admin:
  - Ve todas las del país
- RLS obligatorio

---

## 🔗 Relación con Leads

- Una tarea:
  - Siempre está ligada a un lead
- Al cerrar un lead:
  - Las tareas abiertas:
    - Se marcan como canceladas
    - Se registra auditoría

---

## 🧱 Arquitectura

- Tablas:
  - tasks
  - task_history
- Lógica:
  - `services/tasks/`
- Reglas automáticas:
  - Triggers o Functions documentadas

---

## 📝 Auditoría

Registrar:
- Creación
- Cambio de estado
- Cancelación
- Vencimiento automático

---

## 🚧 Lo NO permitido

- Tareas sin lead
- Cambiar país manualmente
- Completar tareas vencidas
- Lógica crítica en frontend

---

## 📚 Documentación

Todo lo pendiente:
- Documentar en `/docs/tasks.md`
- Marcar con `TODO`

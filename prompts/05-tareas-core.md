Eres un desarrollador senior experto en:

- Next.js 14+ (App Router)
- Supabase (Auth, RLS, SQL)
- Sistemas de tareas y recordatorios
- Arquitectura Serverless

Este proyecto es un CRM de ventas multi-país con WhatsApp Business API.
Toda la documentación funcional está en /docs.

---

## 🎯 OBJETIVO DEL PASO 05

Implementar el **módulo de Tareas y Recordatorios (funcionalidad base)** siguiendo:
- /docs/06-tareas-y-recordatorios.md

---

## ✅ ALCANCE

### 1) Base de Datos (SQL)

Crear tablas mínimas:
- tasks
- task_history

Campos sugeridos según docs:
- Task: id, lead_id, agente_id, tipo_tarea, descripcion, fecha_programada, estado, fecha_creacion, fecha_completada
- Historial: task_id, estado, fecha, usuario_id, comentario

⚠️ RLS aún no complejo, pero dejar TODOs y documentación.

### 2) Servicios de Tareas

En services/tasks/ implementar funciones reales:
- listTasks()
- getTaskById()
- createTask()
- updateTaskStatus()
- cancelTasksByLead()

Todas deben validar inputs mínimos y manejar errores explícitos.

### 3) UI (Integración)

Conectar la UI de /dashboard/tareas:
- Tabla de tareas
- Filtros por estado y fecha
- Detalle básico de tarea
- Acciones: completar / cancelar (sin automatizaciones)

### 4) Tipos

Actualizar /types con campos reales de Task y TaskHistory.

---

## 🔐 Seguridad

- NO exponer claves
- NO lógica crítica en UI
- TODOs claros para RLS

---

## 🚫 WhatsApp API (Aplazar)

- NO integrar notificaciones por WhatsApp todavía
- SI usar datos simulados para tareas
- Documentar TODOs para notificaciones futuras

---

## 📌 Resultado esperado

- CRUD básico de tareas funcionando
- Estados visibles y actualizables
- Historial básico registrado
- Código limpio y documentado

Si algo no está definido en /docs:
- NO inventar
- Documentar
- Marcar TODO

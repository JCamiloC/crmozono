# 06-tareas-y-recordatorios.md

## Objetivo

Definir el sistema de tareas y recordatorios para agentes de ventas, permitiendo el seguimiento de leads cuando no responden o requieren acciones futuras.

Este módulo es clave para evitar la pérdida de oportunidades comerciales.

---

## Concepto General

Las tareas están siempre asociadas a un **lead** y a un **agente de ventas**.

Un agente puede crear tareas manualmente o el sistema puede sugerirlas automáticamente según el estado del lead.

---

## Tipos de Tareas

### 1. Llamar nuevamente

* Cuando el cliente no responde.
* Se agenda con fecha y hora.

### 2. Enviar mensaje de seguimiento

* Mensaje manual o plantilla.

### 3. Esperar respuesta del cliente

* Tarea pasiva con fecha límite.

### 4. Tarea personalizada

* Texto libre definido por el agente.

---

## Campos de una Tarea

Cada tarea debe contener:

* `id`
* `lead_id`
* `agente_id`
* `tipo_tarea`
* `descripcion`
* `fecha_programada`
* `estado` (pendiente / completada / vencida)
* `fecha_creacion`
* `fecha_completada`

---

## Flujo de Creación

### Creación Manual

1. Agente abre el lead
2. Selecciona "Crear tarea"
3. Define tipo, descripción y fecha
4. Guarda la tarea

### Creación Automática

* Si un lead está en `Contactado` y no hay respuesta en X horas
* Si una llamada no fue efectiva

---

## Reglas de Negocio

* Un lead puede tener múltiples tareas activas
* Un agente solo ve sus propias tareas
* Administradores pueden ver todas las tareas de su país

---

## Recordatorios y Alertas

* Notificación interna cuando la tarea esté próxima a vencer
* Notificación cuando una tarea vence sin completarse

---

## Integración con Estados del Lead

* Completar una tarea NO cambia el estado automáticamente
* Algunas tareas pueden sugerir cambio de estado

---

## Automatizaciones Futuras

* Creación automática de tareas por inactividad
* Reglas configurables por administrador

---

## Consideraciones Técnicas

* Las tareas se consultan desde Supabase directamente
* Alertas pueden ejecutarse con funciones programadas

---

## Pendiente para Implementación

* Vista calendario
* Vista Kanban por estado
* Configuración de SLA por país

---

Documento base para implementación y referencia de

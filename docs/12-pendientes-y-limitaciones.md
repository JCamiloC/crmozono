# 11-seguridad-y-rls.md

## Objetivo
Definir los principios de seguridad del sistema y la implementación de Row Level Security (RLS) en Supabase para garantizar acceso controlado a la información según rol y país.

Este documento es la base de la seguridad del CRM.

---

## Principios de Seguridad

### 1. Mínimo Privilegio
Cada usuario solo puede acceder a la información estrictamente necesaria para su rol.

---

### 2. Seguridad por País
El acceso a datos está restringido según el país asignado al usuario.

---

### 3. Seguridad por Rol
Los permisos varían según el rol:
- Superadministrador
- Administrador
- Agente de ventas

---

## Implementación de Row Level Security (RLS)

La seguridad se implementa principalmente mediante RLS en Supabase.

---

### Leads

Reglas:
- Agentes solo pueden ver leads asignados
- Administradores solo pueden ver leads de su país
- Superadministradores pueden ver todos los leads

---

### Tareas

Reglas:
- Agentes solo pueden ver sus propias tareas
- Administradores pueden ver tareas de su país
- Superadministradores pueden ver todas

---

### Mensajes y Llamadas

Reglas:
- Asociados a leads accesibles por el usuario
- No accesibles entre países distintos

---

## Ejemplo Conceptual de Reglas RLS

- `agente_id = auth.uid()`
- `pais = auth.jwt()->>'pais'`
- `rol = 'superadmin'`

*(Las reglas exactas se definen a nivel de base de datos)*

---

## Auditoría del Sistema

Todas las acciones sensibles deben registrarse.

### Acciones auditadas
- Cambios de estado de leads
- Envío de mensajes
- Inicio y fin de llamadas
- Reasignación de leads
- Creación y cierre de tareas

---

### Campos mínimos del Log

- `usuario_id`
- `rol`
- `accion`
- `fecha`
- `entidad_afectada`
- `entidad_id`

---

## Seguridad en Frontend

- Validaciones de permisos antes de mostrar acciones
- Ocultar funcionalidades no autorizadas
- Manejo seguro de sesiones

---

## Consideraciones Técnicas

- RLS obligatorio en todas las tablas sensibles
- Ninguna tabla productiva debe quedar sin RLS
- Las Edge Functions deben validar permisos adicionales

---

## Pendiente para Implementación

- Pruebas de penetración básicas
- Monitoreo de accesos sospechosos
- Alertas de seguridad

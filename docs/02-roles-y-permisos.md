# Roles y Permisos del Sistema

## 1. Objetivo del módulo
Definir de manera clara y estricta los roles del sistema, sus responsabilidades y los permisos asociados a cada uno, garantizando un control de acceso seguro y coherente con la operación multi-país del CRM.

Este documento es la base para la implementación de políticas de seguridad (RLS) en la base de datos.

---

## 2. Roles del sistema
El sistema cuenta con tres roles principales:

1. Superadministrador  
2. Administrador  
3. Agente de ventas  

Cada usuario pertenece a un único rol y está asociado a uno o varios países según su nivel de acceso.

---

## 3. Superadministrador

### Descripción
Usuario con control total del sistema a nivel global.

### Permisos
- Acceso a todos los países
- Gestión completa de usuarios
- Creación, edición y desactivación de administradores
- Acceso a todos los leads
- Configuración global del sistema
- Acceso a métricas globales
- Visualización y auditoría de acciones

### Restricciones
- No puede ser limitado por país
- No participa en la operación diaria de ventas

---

## 4. Administrador

### Descripción
Usuario responsable de la gestión operativa de un país específico.

### Permisos
- Acceso exclusivo a los datos de su país
- Asignación de leads a agentes de ventas
- Reasignación de leads
- Visualización de métricas del país
- Configuración de mensajes automáticos
- Gestión de campañas masivas del país

### Restricciones
- No puede acceder a datos de otros países
- No puede crear superadministradores

---

## 5. Agente de ventas

### Descripción
Usuario operativo encargado del contacto directo con los leads.

### Permisos
- Acceso solo a los leads asignados
- Registro de llamadas
- Cambio de estado de leads
- Creación de tareas y recordatorios
- Envío de mensajes manuales

### Restricciones
- No puede ver leads no asignados
- No puede acceder a métricas globales
- No puede modificar configuraciones

---

## 6. Matriz de permisos

| Funcionalidad | Superadmin | Admin | Agente |
|--------------|------------|-------|--------|
| Ver todos los países | Sí | No | No |
| Gestionar usuarios | Sí | Parcial | No |
| Ver leads | Todos | País | Asignados |
| Asignar leads | Sí | Sí | No |
| Cambiar estado lead | Sí | Sí | Sí |
| Registrar llamadas | Sí | Sí | Sí |
| Crear tareas | Sí | Sí | Sí |
| Mensajería masiva | Sí | Sí | No |
| Configuración sistema | Sí | Parcial | No |

---

## 7. Reglas de negocio clave
- Todo usuario debe estar asociado a un rol
- Todo lead debe tener país asignado
- Un agente solo puede interactuar con leads asignados
- Un administrador solo puede operar dentro de su país
- El superadministrador tiene acceso total sin restricciones geográficas

---

## 8. Consideraciones técnicas
- Los permisos se implementarán principalmente mediante RLS en Supabase
- El rol del usuario debe estar disponible en el JWT
- El país del usuario se utilizará como filtro obligatorio en consultas

---

## 9. Pendientes y decisiones abiertas
- Definir si un administrador puede gestionar múltiples países
- Definir permisos avanzados para reportes

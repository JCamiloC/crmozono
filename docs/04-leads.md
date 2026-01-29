# Gestión de Leads

## 1. Objetivo del módulo
Definir cómo se crean, gestionan, asignan y controlan los leads dentro del CRM, asegurando trazabilidad, correcta asignación por país y cumplimiento de las reglas de negocio.

El lead representa la unidad central del sistema y todo el flujo gira alrededor de él.

---

## 2. Definición de Lead
Un lead es un cliente potencial que ha iniciado contacto o ha sido registrado en el sistema a través de WhatsApp, formularios externos o carga manual.

Cada lead debe estar siempre asociado a:
- Un país
- Un administrador
- Un agente de ventas
- Un estado vigente

---

## 3. Campos principales del Lead

### Identificación
- id
- nombre (opcional)
- telefono (obligatorio, único)
- pais (obligatorio)

### Asignación
- administrador_id (obligatorio)
- agente_id (obligatorio)

### Estado
- estado_actual
- fecha_estado
- historial_estados

### Auditoría
- created_at
- updated_at
- created_by

---

## 4. Origen del Lead
Un lead puede tener uno de los siguientes orígenes:
- WhatsApp Business API
- Facebook Lead Ads
- Importación manual
- Campañas masivas

El origen debe quedar registrado para fines de análisis y trazabilidad.

---

## 5. Reglas de negocio

### Reglas obligatorias
- El teléfono identifica de forma única al lead
- No pueden existir leads duplicados por teléfono
- Todo lead debe tener país asignado
- Todo lead debe tener agente y administrador asignados

### Reglas de visibilidad
- Un agente solo puede ver leads asignados
- Un administrador solo puede ver leads de su país
- El superadministrador puede ver todos los leads

---

## 6. Asignación de Leads

### Asignación automática
1. El sistema detecta el país del lead
2. Se asigna el administrador correspondiente
3. Se asigna un agente disponible del país

### Reasignación
- Puede ser manual por un administrador
- Debe quedar registrada en auditoría
- No elimina historial previo

---

## 7. Ciclo de vida del Lead

1. Lead creado
2. Estado inicial asignado
3. Contacto iniciado
4. Seguimiento
5. Cierre del lead

Un lead solo se considera cerrado cuando alcanza un estado final definido.

---

## 8. Relación con otros módulos
El lead está relacionado con:
- Llamadas
- Tareas y recordatorios
- Mensajes
- Campañas
- Historial de estados

Todos estos módulos deben referenciar al lead.

---

## 9. Consideraciones técnicas
- El control de acceso se implementa con RLS
- El país es el filtro principal de seguridad
- El teléfono debe normalizarse antes de guardarse
- El historial de estados no debe sobrescribirse

---

## 10. Pendientes y decisiones abiertas
- Definir lógica exacta de asignación automática
- Definir reglas de redistribución por inactividad

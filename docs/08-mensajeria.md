# 08-mensajeria-whatsapp.md

## Objetivo
Definir el sistema de mensajería WhatsApp dentro del CRM, incluyendo tipos de mensajes, uso de plantillas, automatizaciones y restricciones impuestas por Meta.

Este módulo es el núcleo de la comunicación con los leads.

---

## Tipos de Mensajes

### 1. Mensajes Automáticos
Mensajes enviados por el sistema sin intervención del agente.

Ejemplos:
- Mensaje de bienvenida al ingresar un lead
- Mensaje automático al cambiar de estado
- Mensaje de garantía tras una venta efectiva

---

### 2. Mensajes Manuales
Mensajes enviados directamente por un agente desde el dashboard.

Características:
- Se envían solo a leads asignados
- Pueden usar plantillas aprobadas
- Permiten texto editable antes del envío

---

### 3. Mensajes Post-Llamada
Mensajes automáticos o semiautomáticos enviados después de una llamada.

Ejemplos:
- Confirmación de información
- Envío de garantía
- Mensaje de seguimiento

---

## Plantillas de Mensajes

Las plantillas deben estar **previamente aprobadas por Meta**.

### Plantillas Definidas
- Bienvenida
- Garantía
- Seguimiento
- Recordatorio

### Reglas
- Las plantillas no pueden modificarse libremente
- Solo se permite cambiar variables dinámicas
- La gestión de plantillas es responsabilidad del Superadministrador

---

## Variables Dinámicas Permitidas

Ejemplos:
- {{nombre}}
- {{producto}}
- {{agente}}
- {{fecha}}

---

## Flujo de Envío

1. El sistema o agente selecciona el tipo de mensaje
2. Se valida consentimiento y ventana de conversación
3. Se selecciona plantilla (si aplica)
4. Se envía el mensaje vía WhatsApp API
5. Se registra el evento en el historial del lead

---

## Restricciones y Políticas de Meta

- Solo se pueden enviar mensajes:
  - Dentro de la ventana de 24 horas
  - O mediante plantillas aprobadas
- El usuario debe haber iniciado la conversación o dado consentimiento
- El envío masivo debe cumplir políticas anti-spam

---

## Mensajería Masiva

El sistema permite:
- Cargar números manualmente
- Asociar números a leads existentes
- Enviar mensajes usando plantillas aprobadas

Restricciones:
- No permite mensajes personalizados fuera de variables
- Solo disponible para usuarios autorizados

---

## Auditoría y Registro

Cada mensaje debe registrar:
- `lead_id`
- `usuario_id`
- `tipo_mensaje`
- `plantilla`
- `fecha_envio`
- `estado_envio`

---

## Consideraciones Técnicas

- Implementado mediante WhatsApp Business API
- Validaciones de ventana de conversación
- Manejo de errores de envío y reintentos
- Registro obligatorio en base de datos

---

## Pendiente para Implementación

- Dashboard de historial de mensajes
- Estadísticas de entrega y lectura
- Programación de mensajes

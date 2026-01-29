# 09-campanas-masivas.md

## Objetivo
Definir el módulo de campañas masivas de WhatsApp, permitiendo el envío controlado de mensajes a múltiples números cumpliendo estrictamente las políticas de Meta y minimizando riesgos de bloqueo.

Este módulo está diseñado para comunicación informativa y comercial controlada, no para spam.

---

## Funcionalidad Principal

El sistema permitirá:

- Cargar listas de números telefónicos
- Asociar números a leads existentes o tratarlos como externos
- Definir un mensaje basado en plantillas aprobadas
- Enviar mensajes en lotes controlados
- Registrar logs completos de cada envío

---

## Origen de los Números

Las campañas pueden usar números provenientes de:

- Leads existentes en el CRM
- Carga manual (CSV o formulario)
- Importaciones autorizadas

Requisito obligatorio:
- Números en formato internacional
- Consentimiento previo del usuario

---

## Mensajes de Campaña

### Reglas
- Solo se pueden usar **plantillas aprobadas por Meta**
- No se permite texto libre fuera de variables dinámicas
- Las variables deben ser genéricas (ej. nombre, producto)

---

## Envío por Lotes

Para reducir riesgos:

- El envío se realiza por lotes
- Se configura:
  - Cantidad máxima por lote
  - Intervalo entre mensajes
- El sistema puede pausar automáticamente una campaña ante errores repetidos

---

## Logs y Auditoría

Cada mensaje enviado debe registrar:

- `campana_id`
- `telefono`
- `lead_id` (si existe)
- `plantilla_usada`
- `fecha_envio`
- `estado_envio` (enviado / fallido / bloqueado)
- `error` (si aplica)

Los logs son obligatorios y no eliminables.

---

## Reglas de Uso

- No se permite envío indiscriminado
- Campañas masivas solo disponibles para:
  - Administradores
  - Superadministrador
- Se debe advertir al cliente sobre riesgos de bloqueo

---

## Riesgos y Mitigaciones

### Riesgos
- Bloqueo del número de WhatsApp
- Restricciones de cuenta por Meta
- Baja tasa de entrega

### Mitigaciones
- Uso exclusivo de plantillas aprobadas
- Límites diarios de envío
- Envío progresivo
- Monitoreo de errores

---

## Consideraciones Técnicas

- Implementado sobre WhatsApp Business API
- Control de rate limit por backend
- Feature flag para habilitar/deshabilitar campañas
- Posibilidad de pausa manual o automática

---

## Pendiente para Implementación

- Vista de estado de campañas
- Estadísticas de entrega
- Programación de campañas

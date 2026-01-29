# 10-webhooks.md

## Objetivo
Definir la gestión de webhooks provenientes de WhatsApp Business API, permitiendo al sistema recibir eventos en tiempo real y sincronizar la información con el CRM.

Este módulo es clave para mantener el estado actualizado de mensajes, leads y llamadas.

---

## Eventos Escuchados

El sistema debe escuchar y procesar los siguientes eventos:

### 1. Mensajes Entrantes
- Mensajes enviados por los clientes
- Inicio de conversación
- Respuestas a campañas o mensajes automáticos

---

### 2. Estados de Mensajes
- Enviado
- Entregado
- Leído
- Fallido

Estos estados deben reflejarse en el historial del lead.

---

### 3. Eventos de Llamadas
- Inicio de llamada
- Fin de llamada
- Errores de llamada
- Duración de la llamada

---

## Flujo General

1. WhatsApp Business API envía el evento
2. El webhook llega a una **Edge Function**
3. Se valida la autenticidad del evento
4. Se procesa el tipo de evento
5. Se persiste la información en Supabase
6. Se disparan automatizaciones si aplica

# 10-webhooks.md

## Objetivo
Definir la gestión de webhooks provenientes de WhatsApp Business API, permitiendo al sistema recibir eventos en tiempo real y sincronizar la información con el CRM.

Este módulo es clave para mantener el estado actualizado de mensajes, leads y llamadas.

---

## Eventos Escuchados

El sistema debe escuchar y procesar los siguientes eventos:

### 1. Mensajes Entrantes
- Mensajes enviados por los clientes
- Inicio de conversación
- Respuestas a campañas o mensajes automáticos

---

### 2. Estados de Mensajes
- Enviado
- Entregado
- Leído
- Fallido

Estos estados deben reflejarse en el historial del lead.

---

### 3. Eventos de Llamadas
- Inicio de llamada
- Fin de llamada
- Errores de llamada
- Duración de la llamada

---

## Flujo General

1. WhatsApp Business API envía el evento
2. El webhook llega a una **Edge Function**
3. Se valida la autenticidad del evento
4. Se procesa el tipo de evento
5. Se persiste la información en Supabase
6. Se disparan automatizaciones si aplica

WhatsApp → Edge Function → Supabase


---

## Procesamiento de Eventos

- Identificación del tipo de evento
- Asociación con:
  - Lead
  - Mensaje
  - Llamada
- Registro de logs técnicos y funcionales

---

## Seguridad

Para todos los webhooks:

- Validación de firma enviada por Meta
- Validación del origen del request
- Rechazo de eventos no válidos
- Manejo seguro de secretos

---

## Logs de Eventos

Cada evento debe registrar como mínimo:

- `tipo_evento`
- `payload_original`
- `fecha_recepcion`
- `procesado` (sí / no)
- `error` (si aplica)

Los logs no deben eliminarse.

---

## Manejo de Errores

- Reintentos controlados
- Registro de fallos
- Alertas internas ante errores críticos

---

## Consideraciones Técnicas

- Las Edge Functions deben ser idempotentes
- Deben soportar alta concurrencia
- Separar lógica por tipo de evento
- No bloquear el webhook por procesos largos

---

## Pendiente para Implementación

- Dashboard de monitoreo de eventos
- Alertas automáticas por fallos
- Reprocesamiento manual de eventos

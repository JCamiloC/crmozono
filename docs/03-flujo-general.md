# Flujo General del Sistema

## 1. Objetivo del flujo
Describir de forma clara y secuencial el funcionamiento completo del CRM, desde la entrada de un lead hasta el cierre de la gestión comercial, incluyendo automatizaciones y controles.

Este flujo sirve como referencia principal para el desarrollo del frontend, backend y automatizaciones.

---

## 2. Canales de entrada de leads

### 2.1 WhatsApp Business API
- El cliente envía un mensaje por WhatsApp
- El mensaje es recibido por un webhook
- El sistema procesa y registra el lead

### 2.2 Facebook Lead Ads (opcional)
- El usuario deja sus datos en un anuncio
- Meta envía el lead al webhook
- El sistema crea o actualiza el lead

### 2.3 Carga manual
- Administrador o superadministrador crea el lead manualmente

---

## 3. Flujo principal del lead

1. El lead ingresa al sistema
2. Se valida si el lead ya existe por número telefónico
3. Se asigna el país al lead
4. Se asigna un administrador según el país
5. Se asigna un agente de ventas
6. Se establece el estado inicial del lead
7. Se registra la fecha del estado (`fecha_estado`)
8. Se envía mensaje de bienvenida automático
9. El agente inicia contacto con el lead

---

## 4. Flujo de contacto y seguimiento

### 4.1 Llamadas
- El agente realiza o registra una llamada
- Se registra duración, fecha y resultado
- Se completa formulario post-llamada

### 4.2 Resultados de llamada
- Venta efectiva
- Seguimiento
- No interesado
- Llamada no contestada

### 4.3 Automatización post-llamada
- Si la llamada es efectiva → mensaje automático de garantía
- Si no contestó → creación de tarea de seguimiento

---

## 5. Flujo de estados del lead

- Cada cambio de estado actualiza `fecha_estado`
- El sistema controla el tiempo máximo por estado (5 días)
- Si el tiempo vence:
  - Se genera alerta
  - Se bloquea el cierre sin acción

---

## 6. Flujo de tareas y recordatorios

1. El agente crea una tarea
2. Define fecha y tipo de recordatorio
3. El sistema notifica al agente
4. La tarea puede ser completada o vencida
5. Las tareas vencidas generan alertas

---

## 7. Flujo de mensajería

### 7.1 Mensajes automáticos
- Bienvenida
- Post-llamada
- Seguimiento

### 7.2 Mensajes manuales
- Enviados por el agente desde el dashboard

### 7.3 Mensajería masiva
- Administrador carga números
- Define mensaje
- Se envía por lotes
- Se registran logs

---

## 8. Flujo administrativo

### Administrador
- Supervisa agentes
- Reasigna leads
- Gestiona campañas
- Visualiza métricas del país

### Superadministrador
- Gestiona países
- Configura el sistema
- Accede a auditorías globales

---

## 9. Manejo de errores y excepciones
- Leads duplicados
- Fallos en envío de mensajes
- Webhooks inválidos
- Restricciones de Meta

Todos los errores deben registrarse en logs.

---

## 10. Pendientes
- Automatización de reasignación por inactividad
- Reportes avanzados

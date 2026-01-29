# 07-llamadas-whatsapp.md

## Objetivo
Definir el flujo, reglas de negocio y consideraciones técnicas para la gestión de llamadas mediante WhatsApp Business Calling API dentro del CRM.

Este módulo permite a los agentes realizar llamadas directamente desde el dashboard y registrar el resultado comercial de cada llamada.

---

## Alcance del Módulo

El sistema permitirá:
- Iniciar llamadas desde el dashboard hacia un lead
- Registrar cada llamada realizada
- Asociar un formulario post-llamada obligatorio
- Vincular la llamada con el estado del lead

---

## Flujo General de una Llamada

1. El agente abre un lead asignado
2. Selecciona la opción **“Llamar por WhatsApp”**
3. El sistema valida:
   - Lead activo
   - Agente autorizado
4. Se inicia la llamada vía WhatsApp Calling API
5. Al finalizar la llamada:
   - Se obliga a completar formulario post-llamada
6. Según el resultado:
   - Puede cambiar el estado del lead
   - Puede crear tareas de seguimiento

---

## Reglas de Negocio

- Solo **agentes de ventas** pueden iniciar llamadas
- El lead debe estar:
  - Asignado al agente
  - No cerrado
- No se permite cerrar una venta sin una llamada registrada
- Cada llamada debe tener un resultado documentado

---

## Registro de Llamadas

Cada llamada debe almacenar como mínimo:

- `id`
- `lead_id`
- `agente_id`
- `fecha_inicio`
- `fecha_fin`
- `duracion`
- `resultado_llamada`
- `observaciones`

---

## Resultados de Llamada (Formulario Post-Llamada)

El formulario post-llamada es **obligatorio** y usa un **select con valores predefinidos**.

### Valores sugeridos
- Venta efectiva
- Cliente interesado
- Cliente no interesado
- No contesta
- Llamada cortada
- Número incorrecto

Campos adicionales:
- Observaciones (opcional)
- Próxima acción (opcional)

---

## Integración con Estados del Lead

- Al registrar una llamada:
  - El lead puede pasar a `Llamada realizada`
- Si el resultado es **Venta efectiva**:
  - Se habilita el cierre del lead
  - Se dispara mensaje automático de garantía
- Si no es efectiva:
  - Se sugiere creación de tarea de seguimiento

---

## Automatizaciones Asociadas

- Cambio automático de estado a `Llamada realizada`
- Sugerencia de tareas post-llamada
- Bloqueo de cierre sin llamada registrada

---

## Permisos

- Agente:
  - Iniciar llamadas
  - Registrar formulario post-llamada
- Administrador:
  - Ver registros de llamadas
- Superadministrador:
  - Configurar reglas y resultados

---

## Consideraciones Técnicas

- La WhatsApp Calling API:
  - Requiere aprobación explícita de Meta
  - No está disponible en todos los países
- El sistema debe contemplar:
  - Feature flag para habilitar/deshabilitar llamadas
- El registro de llamadas es independiente del proveedor final

---

## Pendiente para Implementación

- Confirmar disponibilidad de Calling API por país
- Manejo de errores de llamada
- Reportes de llamadas por agente

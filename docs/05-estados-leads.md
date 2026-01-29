# 05-estados-leads.md

## Objetivo

Definir el sistema de estados de los leads, sus reglas de negocio, tiempos máximos y validaciones automáticas dentro del CRM WhatsApp.

Este documento sirve como referencia funcional y técnica para la implementación.

---

## Estados del Lead

Los leads pasan por un flujo controlado de estados. Cada cambio de estado debe quedar registrado con fecha y usuario responsable.

### Estados definidos

1. **Nuevo**

   * Lead recién ingresado desde Facebook Ads o carga manual.
   * Aún no ha sido contactado.

2. **Contactado**

   * El agente ya inició conversación por WhatsApp.

3. **En seguimiento**

   * El cliente mostró interés, pero no ha cerrado.
   * Puede tener tareas o recordatorios activos.

4. **Llamada realizada**

   * Se realizó una llamada vía WhatsApp Calling API.
   * Debe existir un formulario post-llamada asociado.

5. **Venta efectiva**

   * El cliente compró el producto.
   * Se dispara mensaje automático de garantía / confirmación.

6. **No interesado**

   * El cliente rechaza el producto.

7. **Cerrado por tiempo**

   * El lead se cerró automáticamente por exceder el tiempo máximo.

---

## Reglas de Tiempo por Estado

Cada lead tiene un campo obligatorio:

* `fecha_estado` (timestamp)

Este campo se actualiza **cada vez que el estado cambia**.

### Límite global

* Tiempo máximo total del lead: **5 días** desde su creación.

### Validaciones automáticas

* Si pasan 5 días sin llegar a **Venta efectiva**:

  * El sistema cambia el estado a `Cerrado por tiempo`.
  * Se bloquean nuevas acciones comerciales.

---

## Reglas de Cambio de Estado

* Solo **Agentes de ventas** pueden cambiar estados operativos.
* **Administradores** pueden forzar cambios.
* **Superadministrador** puede modificar reglas y tiempos.

### Restricciones

* No se puede pasar a `Venta efectiva` sin:

  * Llamada registrada
  * Formulario post-llamada completo

* Un lead cerrado no puede reabrirse.

---

## Automatizaciones Asociadas

### Al cambiar a `Contactado`

* Se registra la primera interacción.

### Al cambiar a `Llamada realizada`

* Se habilita formulario post-llamada.

### Al cambiar a `Venta efectiva`

* Envío automático de mensaje de garantía.

### Al cerrar por tiempo

* Notificación interna al agente y administrador.

---

## Campos Relacionados en Base de Datos

* `estado`
* `fecha_estado`
* `fecha_creacion`
* `agente_id`
* `administrador_id`
* `pais`

---

## Consideraciones Técnicas

* Las validaciones de tiempo se ejecutan vía:

  * Supabase cron / edge function
* Todas las transiciones deben auditarse.

---

## Pendiente para Implementación

* Dashboard visual de estados
* Alertas por vencimiento cercano
* Configuración dinámica de tiempos

---

Documento base para implementación y referencia de IA.

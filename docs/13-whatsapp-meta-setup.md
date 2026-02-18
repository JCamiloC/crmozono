# 13-whatsapp-meta-setup.md

## Objetivo

Conectar WhatsApp Business Platform (Meta Developers) al CRM para recibir mensajes en tiempo real y centralizarlos en el módulo de mensajería.

---

## 1) URLs oficiales del proyecto (producción)

- Sitio/login: `https://crm.superozonoglobal.com/login`
- Política de privacidad: `https://crm.superozonoglobal.com/politica-privacidad`
- Webhook callback: `https://crm.superozonoglobal.com/api/webhooks/whatsapp`

Estas URLs usan SSL válido y pueden registrarse directamente en Meta.

---

## 2) Variables de entorno requeridas

Configurar en `.env`:

- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_DEFAULT_LEAD_COUNTRY` (opcional, recomendado)
- `WHATSAPP_DEFAULT_ADMIN_ID` (opcional, recomendado)
- `WHATSAPP_DEFAULT_AGENT_ID` (opcional, recomendado)

Además de Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 3) Dónde obtener cada token/ID en Meta (paso a paso)

### 3.1 `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

Este token **lo defines tú** (no lo entrega Meta).

1. Crea un valor seguro aleatorio (mínimo 32 caracteres)
2. Guárdalo en `.env` como `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Usa exactamente el mismo valor al configurar Webhook en Meta

---

### 3.2 `WHATSAPP_APP_SECRET`

1. Ir a Meta Developers → tu App
2. Menú lateral: **App settings** → **Basic**
3. Click en **Show** sobre **App Secret**
4. Copiar el valor y guardarlo en `.env` como `WHATSAPP_APP_SECRET`

---

### 3.3 `WHATSAPP_ACCESS_TOKEN`

Para desarrollo puedes usar token temporal; para producción conviene token de larga duración con System User.

Ruta rápida (desarrollo):
1. Meta Developers → tu App → **WhatsApp** → **API Setup**
2. Buscar sección **Temporary access token**
3. Copiar token a `.env` como `WHATSAPP_ACCESS_TOKEN`

Ruta recomendada (producción):
1. Meta Business Manager → **Business Settings**
2. **Users** → **System Users** → crear/seleccionar usuario del sistema
3. Asignar assets de WhatsApp (WABA / phone number)
4. Generar token con permisos de WhatsApp para la app
5. Guardar token en `.env` como `WHATSAPP_ACCESS_TOKEN`

---

### 3.4 `WHATSAPP_PHONE_NUMBER_ID`

1. Meta Developers → tu App → **WhatsApp** → **API Setup**
2. Buscar bloque del número conectado
3. Copiar `Phone number ID`
4. Guardar en `.env` como `WHATSAPP_PHONE_NUMBER_ID`

---

### 3.5 `WHATSAPP_BUSINESS_ACCOUNT_ID`

1. Meta Developers → tu App → **WhatsApp** → **API Setup**
2. Copiar `WhatsApp Business Account ID`
3. Guardar en `.env` como `WHATSAPP_BUSINESS_ACCOUNT_ID`

---

## 4) Configurar webhook en Meta

1. Meta Developers → **WhatsApp** → **Configuration** → **Webhook**
2. Click en **Edit**
3. Callback URL: `https://crm.superozonoglobal.com/api/webhooks/whatsapp`
4. Verify token: valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
5. Guardar
6. Suscribir campo `messages`

Si todo está correcto, Meta valida vía `hub.challenge` y devuelve verificación exitosa.

---

## 5) Flujo de recepción ya implementado en el CRM

Cuando llega un mensaje entrante:

1. Se valida firma con `WHATSAPP_APP_SECRET` (si está configurado)
2. Se guarda evento crudo en `webhook_events`
3. Se busca lead por teléfono (`leads.telefono`)
4. Si existe lead:
   - Se crea/actualiza `conversations`
   - Se registra mensaje inbound en `messages`
5. Si no existe lead:
   - Se detecta país por indicativo telefónico (ej. `57 -> CO`)
   - Se busca país en `countries`
   - Se asigna `admin` y `agente` del país desde `profiles`
   - Si falta configuración por país, usa fallback por variables de entorno
   - Se crea lead automáticamente con estado `nuevo`
   - Se registra historial inicial en `lead_status_history`
   - Se crea/actualiza conversación y mensaje inbound

---

## 6) SQL requerido (ya corrido)

- `10_conversations.sql`
- `11_messages.sql`
- `12_message_templates.sql`
- `17_webhook_events.sql`
- `09_permissions_no_rls.sql` (solo desarrollo)

---

## 7) Verificación end-to-end

1. Enviar mensaje desde WhatsApp al número configurado
2. Confirmar request `POST` al webhook en logs
3. Validar inserciones en:
   - `webhook_events`
   - `conversations`
   - `messages`
4. Abrir `https://crm.superozonoglobal.com/dashboard/mensajes` y confirmar conversación

Checklist esperado por cada mensaje nuevo:

- `webhook_events`: fila `message_received` creada
- `webhook_events.processed = true`
- `leads`: lead existente o auto-creado por teléfono
- `conversations`: conversación creada/actualizada
- `messages`: mensaje inbound insertado

Si el mismo mensaje llega dos veces (reintento Meta):

- no debe duplicar `messages`
- aparece en resumen como `duplicateCount`

---

## 8) Errores comunes

- **403 webhook verification failed**: verify token distinto entre `.env` y Meta
- **401 invalid signature**: `WHATSAPP_APP_SECRET` incorrecto
- **No entra al CRM**: revisar asignación por defecto (`WHATSAPP_DEFAULT_ADMIN_ID`, `WHATSAPP_DEFAULT_AGENT_ID`, `WHATSAPP_DEFAULT_LEAD_COUNTRY`)
- **Asignación incorrecta de país**: validar código ISO en `countries.code` y perfiles `admin/agente` con `country_id` correcto
- **No llegan eventos**: campo `messages` no suscrito
- **Mensaje no textual**: ahora se guarda como placeholder (`[image]`, `[interactive]`, etc.)

---

## 9) Checklist pre-deploy (evitar iteraciones)

Antes de desplegar cambios de webhook:

1. Ejecutar `npm run lint` y `npm run build`
2. Confirmar SQL aplicado:
   - `17_webhook_events.sql`
   - `19_webhook_idempotency.sql`
3. Verificar que exista al menos un `admin` y un `agente` por país en `profiles`
4. Verificar fallback en `.env`:
   - `WHATSAPP_DEFAULT_ADMIN_ID`
   - `WHATSAPP_DEFAULT_AGENT_ID`
   - `WHATSAPP_DEFAULT_LEAD_COUNTRY`
5. Confirmar webhook Meta sigue apuntando al callback correcto

---

## 10) Nota de seguridad

- RLS está diferida por decisión del proyecto y se aplicará al final.
- Antes de producción final: activar RLS, reducir permisos y revisar llaves sensibles.

Eres un desarrollador senior experto en:

- Supabase (Auth, SQL, RLS)
- Next.js App Router
- Arquitectura Serverless
- Modelado de bases de datos para CRMs
- Seguridad y control de acceso por roles

Este proyecto es un CRM de ventas con WhatsApp API.
Toda la documentación funcional está en `/docs`.

---

## 🎯 OBJETIVO DE ESTA IMPLEMENTACIÓN

Configurar correctamente la **conexión con Supabase** y dejar:

- Cliente Supabase funcional en frontend y server
- Variables de entorno documentadas
- Estructura SQL versionada
- Tablas base creadas vía SQL
- Usuario administrador inicial creado
- Login funcional desde el frontend

⚠️ NO implementar lógica de negocio avanzada  
⚠️ NO implementar WhatsApp API  
⚠️ NO crear RLS complejas aún  

---

## 🧱 ALCANCE

### 1️⃣ Variables de Entorno

Crear archivo:

- `.env.example`

Debe incluir:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (documentada, NO usada en frontend)

⚠️ No crear `.env`
⚠️ No hardcodear valores

---

### 2️⃣ Cliente Supabase

Crear clientes separados:

- Cliente frontend (anon)
- Cliente server-side

Ubicación sugerida:
- `/lib/supabase/client.ts`
- `/lib/supabase/server.ts`

Debe:
- Usar variables de entorno
- Estar documentado
- Ser reutilizable

---

### 3️⃣ Carpeta SQL Versionada

Crear carpeta:

- `/sql`

Dentro crear archivos numerados:

- `01_auth_profiles.sql`
- `02_roles.sql`
- `03_countries.sql`
- `04_users.sql`

Cada archivo debe:
- Tener comentarios claros
- Poder ejecutarse manualmente en Supabase
- No depender de frontend

---

### 4️⃣ Modelo Base de Datos (MVP)

#### Tablas mínimas:

##### profiles
- id (uuid, auth.users)
- email
- role
- country_id
- created_at

##### roles
- id
- name (superadmin, admin, agente)

##### countries
- id
- name
- code

---

### 5️⃣ Usuario Administrador Inicial

Crear archivo SQL:

- `99_seed_admin.sql`

Debe:
- Insertar un país
- Insertar rol admin
- Crear un usuario admin
- Asociarlo al perfil

Credenciales:
- Email: admin@crm.local
- Password: admin123

⚠️ Este SQL es SOLO para entorno de pruebas  
⚠️ Documentar que debe eliminarse en producción  

---

### 6️⃣ Auth + Login Frontend

- Usar Supabase Auth
- Login por email/password
- Al iniciar sesión:
  - Obtener perfil desde `profiles`
  - Redirigir a `/dashboard`
- NO hardcodear roles
- NO asumir país

---

### 7️⃣ Documentación

Actualizar o crear:

- `/docs/supabase.md`

Debe incluir:
- Orden de ejecución de SQL
- Explicación de cada tabla
- Advertencias de seguridad
- TODOs de RLS

---

## 🚧 REGLAS OBLIGATORIAS

- NO exponer service role key
- NO lógica de permisos en frontend
- NO usar Supabase directamente en componentes
- Usar siempre capas (`lib` / `services`)
- Código comentado y claro

---

## 🧠 EXPECTATIVA FINAL

Al finalizar:
- El frontend puede iniciar sesión
- El admin puede entrar al dashboard
- La base queda lista para RLS
- El SQL queda versionado y claro
- El proyecto queda listo para implementar Leads y Tareas

Si algo no está definido en `/docs`:
- NO inventar
- Documentar
- Marcar como TODO

Comienza analizando la arquitectura y luego genera el código y los archivos SQL.

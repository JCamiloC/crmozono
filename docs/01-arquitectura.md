# Arquitectura del Sistema

## 1. Objetivo de la arquitectura
Definir una arquitectura escalable, segura y de rápida implementación para un CRM de ventas basado en WhatsApp Business API, que permita operar en múltiples países y con distintos niveles de usuario.

La arquitectura prioriza:
- Velocidad de desarrollo
- Seguridad por diseño
- Bajo costo operativo
- Facilidad de mantenimiento

---

## 2. Enfoque general
El sistema utiliza una arquitectura **serverless híbrida**, donde el frontend asume gran parte de la lógica y el backend se limita a funciones críticas y sensibles.

El objetivo es reducir complejidad sin sacrificar seguridad ni escalabilidad.

---

## 3. Componentes del sistema

### 3.1 Frontend – Next.js
Responsabilidades:
- Interfaz de usuario
- Gestión de sesiones
- Validaciones básicas
- Consumo de Supabase
- Renderizado de dashboards y flujos de negocio

Tecnología:
- Next.js (App Router)
- TypeScript

---

### 3.2 Base de Datos y Autenticación – Supabase
Responsabilidades:
- Almacenamiento de datos del CRM
- Autenticación de usuarios
- Control de acceso por rol y país mediante RLS
- Auditoría básica de acciones

Tecnología:
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

---

### 3.3 Backend lógico – Edge / Serverless Functions
Responsabilidades:
- Recepción y validación de webhooks de WhatsApp
- Envío de mensajes automáticos
- Integración con WhatsApp Business API
- Integración con WhatsApp Calling API (si está habilitada)
- Validaciones sensibles
- Procesos asincrónicos

Nota:
Este backend se limita exclusivamente a procesos que no deben ejecutarse desde el frontend.

---

### 3.4 Integraciones externas
- WhatsApp Business API (mensajería)
- WhatsApp Calling API (opcional, requiere aprobación de Meta)
- Meta Webhooks
- Facebook Lead Ads (opcional)

---

## 4. Flujo de comunicación del sistema
Usuario → Frontend (Next.js)
Frontend → Supabase (DB + Auth)
WhatsApp → Webhook → Edge Function → Supabase
Edge Function → WhatsApp Business API


Este flujo permite separar claramente la lógica de negocio de las integraciones externas, manteniendo el frontend libre de credenciales sensibles.

---

## 5. Seguridad

### 5.1 Principios de seguridad
- Las credenciales nunca se exponen en el frontend
- Acceso controlado estrictamente por rol y país
- Validación obligatoria de eventos externos

### 5.2 Medidas implementadas
- Row Level Security (RLS) en todas las tablas sensibles
- Validación de firma en webhooks
- Registro de acciones críticas
- Restricción de funciones administrativas

---

## 6. Escalabilidad
La arquitectura permite:
- Agregar nuevos países sin cambios estructurales
- Incrementar agentes de ventas sin impacto en rendimiento
- Incorporar nuevas integraciones futuras

---

## 7. Decisiones técnicas clave

| Decisión | Justificación |
|--------|---------------|
| Supabase | Rapidez, SQL nativo y RLS |
| Serverless | Bajo costo y escalabilidad automática |
| Next.js | Frontend moderno y flexible |
| WhatsApp API | Canal principal de contacto |

---

## 8. Limitaciones conocidas
- Dependencia de la aprobación de Meta para ciertas funcionalidades
- Restricciones propias de WhatsApp Business API
- Políticas anti-spam externas

---

## 9. Pendientes
- Definición exacta de Edge Functions
- Configuración de ambientes (desarrollo y producción)


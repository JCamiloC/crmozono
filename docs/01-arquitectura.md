# Arquitectura del Sistema

## Enfoque general
Arquitectura serverless con frontend fuerte y backend mínimo.

## Componentes
- Frontend: Next.js (App Router)
- Base de datos: Supabase (PostgreSQL)
- Autenticación: Supabase Auth
- Backend lógico: Edge Functions
- Integraciones externas: WhatsApp API

## Diagrama conceptual
Frontend → Supabase → Edge Functions → WhatsApp API

## Decisiones técnicas
- No exponer credenciales en frontend
- Usar RLS para seguridad por rol y país
- Backend solo para lógica crítica

## Escalabilidad
- Multi-país
- Multi-agente
- Preparado para nuevas integraciones

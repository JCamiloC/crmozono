# Estrategia RLS (fase final)

## Decisión actual

RLS queda **pospuesta para la fase final** de implementación.

Motivo:
- Durante desarrollo funcional, políticas RLS incompletas pueden bloquear consultas e inserciones y ralentizar entrega de módulos.

## Regla de trabajo temporal

- Implementar primero:
	- Modelo de datos
	- Servicios de negocio
	- Flujos de UI
	- Webhooks y auditoría
- Evitar depender de bypasses inseguros en frontend.
- Mantener todas las operaciones sensibles en capa server/service.

## Cuándo activar RLS

RLS se activa al entrar en fase de hardening, cuando:

1. Los módulos funcionales principales estén conectados a Supabase.
2. Existan pruebas de flujo CRUD para leads, tareas, mensajes y llamadas.
3. Estén definidos los claims de rol/país en sesión/JWT.

## Alcance mínimo obligatorio de RLS (fase final)

- `profiles`
- `leads`
- `lead_status_history`
- `tasks`
- `task_history`
- `messages` (cuando exista tabla productiva)
- `calls` (cuando exista tabla productiva)
- `campaign_logs` (cuando exista tabla productiva)
- `audit_logs`

## Checklist final antes de producción

- [ ] RLS habilitada en todas las tablas sensibles.
- [ ] Políticas por rol (`superadmin`, `admin`, `agente`).
- [ ] Restricción por país en toda lectura/escritura aplicable.
- [ ] Pruebas de acceso cruzado entre países (debe fallar).
- [ ] Pruebas de privilegio mínimo por rol.
- [ ] Revisión de operaciones con `service_role` solo en backend seguro.

## Nota

Esta postergación es **solo de implementación temporal**. No se debe desplegar producción sin RLS activa y probada.

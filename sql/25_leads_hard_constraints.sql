-- 25_leads_hard_constraints.sql
-- Hard constraints de integridad para leads (sin RLS)

alter table public.leads
  alter column origen set not null;

-- Enforce dominio controlado para origen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_origen_check'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_origen_check
      CHECK (origen in ('whatsapp', 'facebook_ads', 'manual', 'campaign'));
  END IF;
END $$;

-- Relación opcional a profiles para created_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_created_by_fkey'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice único por teléfono normalizado para evitar duplicados por formato
-- Nota: si existen duplicados normalizados, este bloque lanzará error controlado.
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT count(*)
  INTO duplicate_count
  FROM (
    SELECT regexp_replace(telefono, '[^0-9]', '', 'g') as normalized_phone
    FROM public.leads
    GROUP BY regexp_replace(telefono, '[^0-9]', '', 'g')
    HAVING count(*) > 1
  ) duplicated;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'No se puede crear índice único: existen teléfonos duplicados normalizados.';
  END IF;
END $$;

create unique index if not exists leads_phone_normalized_unique
  on public.leads ((regexp_replace(telefono, '[^0-9]', '', 'g')));

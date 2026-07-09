-- Colonna "nota" (nota opzionale per persona), usata da app ed export.
-- Eseguire una volta.
alter table public.users add column if not exists nota text;

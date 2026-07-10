-- Stato di invio del piano per persona.
-- La dashboard/Excel mostrano SOLO i piani con inviato = true; le modifiche
-- in corso (prima dell'invio) non compaiono. Eseguire una volta.
alter table public.users add column if not exists inviato boolean not null default false;
alter table public.users add column if not exists inviato_at timestamptz;

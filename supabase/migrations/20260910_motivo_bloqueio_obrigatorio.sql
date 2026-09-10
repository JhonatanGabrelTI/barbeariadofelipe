-- Garante que todo bloqueio de cliente tenha uma justificativa registrada.
update public.blocked_clients
set motivo = 'Motivo não informado (registro anterior)'
where motivo is null or trim(motivo) = '';

alter table public.blocked_clients
    alter column motivo set not null;

alter table public.blocked_clients
    drop constraint if exists blocked_clients_motivo_obrigatorio;

alter table public.blocked_clients
    add constraint blocked_clients_motivo_obrigatorio
    check (length(trim(motivo)) > 0);

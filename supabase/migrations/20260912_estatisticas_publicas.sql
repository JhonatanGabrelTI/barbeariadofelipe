-- Contadores publicos sem expor nomes, telefones ou dados da agenda.
drop function if exists public.obter_estatisticas_publicas();

create function public.obter_estatisticas_publicas()
returns table (total_atendimentos_concluidos bigint)
language sql
stable
security definer
set search_path=public,pg_catalog
as $$
    select count(*)
    from public.agendamentos
    where status = 'realizado';
$$;

revoke all on function public.obter_estatisticas_publicas() from public;
grant execute on function public.obter_estatisticas_publicas() to anon, authenticated;

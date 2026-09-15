-- Uma única fonte de verdade para o painel e para os horários públicos.
-- Evita listas parciais no painel e diferenças de cálculo entre aparelhos.

create or replace function public.listar_agendamentos_painel()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
    v_staff_id uuid := public.current_barbeiro_id();
    v_is_owner boolean := public.is_barbearia_owner();
    v_result jsonb;
begin
    if auth.uid() is null or v_staff_id is null then
        raise exception 'Acesso não autorizado' using errcode='42501';
    end if;

    select coalesce(jsonb_agg(to_jsonb(a) order by a.data_hora,a.id),'[]'::jsonb)
      into v_result
      from public.agendamentos a
     where v_is_owner or a.barbeiro_id=v_staff_id;

    return v_result;
end;
$$;

revoke all on function public.listar_agendamentos_painel() from public;
grant execute on function public.listar_agendamentos_painel() to authenticated;

create or replace function public.listar_disponibilidade_publica(
    p_data date,
    p_servico text,
    p_barbeiro_id uuid
)
returns table (
    horario text,
    disponivel boolean,
    motivo text
)
language sql
stable
security definer
set search_path=public
as $$
    with configuracao as (
        select s.duracao_minutos
          from public.servicos s
         where s.nome=p_servico and s.ativo=true
         limit 1
    ), horarios as (
        select gs::time as hora_inicio,
               (p_data+gs::time) at time zone 'America/Sao_Paulo' as inicio,
               ((p_data+gs::time) at time zone 'America/Sao_Paulo')
                   + make_interval(mins=>(select duracao_minutos from configuracao)) as fim
          from generate_series(
              timestamp '2000-01-01 09:00',
              timestamp '2000-01-01 19:30',
              interval '30 minutes'
          ) gs
    ), avaliados as (
        select h.*,
            case
                when not exists(select 1 from configuracao) then 'servico_indisponivel'
                when not exists(select 1 from public.barbeiros b where b.id=p_barbeiro_id and b.ativo=true) then 'profissional_indisponivel'
                when extract(dow from p_data)=0 then 'fechado'
                when h.inicio<=now() then 'passado'
                when h.fim>((p_data+time '20:00') at time zone 'America/Sao_Paulo') then 'sem_tempo'
                when exists(
                    select 1 from public.blocked_slots b
                     where b.barbeiro_id=p_barbeiro_id and b.data=p_data
                       and h.hora_inicio<b.hora_fim
                       and (h.fim at time zone 'America/Sao_Paulo')::time>b.hora_inicio
                ) then 'bloqueado'
                when exists(
                    select 1 from public.agendamentos a
                     where a.barbeiro_id=p_barbeiro_id and a.status<>'cancelado'
                       and h.inicio<a.data_hora+make_interval(mins=>coalesce(a.duracao_minutos,30))
                       and h.fim>a.data_hora
                ) then 'ocupado'
                else null
            end as motivo_calculado
          from horarios h
    )
    select to_char(hora_inicio,'HH24:MI'),
           motivo_calculado is null,
           motivo_calculado
      from avaliados
     order by hora_inicio;
$$;

revoke all on function public.listar_disponibilidade_publica(date,text,uuid) from public;
grant execute on function public.listar_disponibilidade_publica(date,text,uuid) to anon,authenticated;


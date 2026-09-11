-- Criação atômica de bloqueios de horário, com validação de profissional,
-- expediente, duplicidade e agendamentos já confirmados.

create or replace function public.criar_bloqueio_horario(
    p_data date,
    p_hora_inicio time,
    p_hora_fim time,
    p_motivo text,
    p_barbeiro_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
    v_bloqueio public.blocked_slots;
    v_inicio timestamptz;
    v_fim timestamptz;
    v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
    if auth.uid() is null or public.current_barbeiro_id() is null then
        return jsonb_build_object('success',false,'message','Entre novamente no painel para bloquear horários.');
    end if;
    if not public.is_barbearia_owner() and public.current_barbeiro_id()<>p_barbeiro_id then
        return jsonb_build_object('success',false,'message','Você só pode bloquear a sua própria agenda.');
    end if;
    if p_data<v_hoje or p_data>v_hoje+90 then
        return jsonb_build_object('success',false,'message','Escolha uma data válida nos próximos 90 dias.');
    end if;
    if extract(dow from p_data)=0 then
        return jsonb_build_object('success',false,'message','A barbearia não abre aos domingos.');
    end if;
    if p_hora_inicio>=p_hora_fim
       or p_hora_inicio<time '09:00'
       or p_hora_fim>time '20:00'
       or extract(second from p_hora_inicio)<>0
       or extract(second from p_hora_fim)<>0
       or extract(minute from p_hora_inicio) not in (0,30)
       or extract(minute from p_hora_fim) not in (0,30) then
        return jsonb_build_object('success',false,'message','Escolha um intervalo válido entre 09:00 e 20:00.');
    end if;

    v_inicio:=(p_data+p_hora_inicio) at time zone 'America/Sao_Paulo';
    v_fim:=(p_data+p_hora_fim) at time zone 'America/Sao_Paulo';

    perform pg_advisory_xact_lock(hashtextextended(
        p_barbeiro_id::text||p_data::text,0
    ));

    if exists(select 1 from public.blocked_slots b
      where b.barbeiro_id=p_barbeiro_id and b.data=p_data
        and p_hora_inicio<b.hora_fim and p_hora_fim>b.hora_inicio) then
        return jsonb_build_object('success',false,'message','Esse horário já possui um bloqueio.');
    end if;

    if exists(select 1 from public.agendamentos a
      where a.barbeiro_id=p_barbeiro_id and a.status<>'cancelado'
        and v_inicio<a.data_hora+make_interval(mins=>coalesce(a.duracao_minutos,30))
        and v_fim>a.data_hora) then
        return jsonb_build_object('success',false,'message','Já existe um cliente agendado nesse intervalo.');
    end if;

    insert into public.blocked_slots(data,hora_inicio,hora_fim,motivo,created_by,barbeiro_id)
    values(p_data,p_hora_inicio,p_hora_fim,coalesce(nullif(trim(p_motivo),''),'Pausa'),auth.uid(),p_barbeiro_id)
    returning * into v_bloqueio;

    return jsonb_build_object('success',true,'data',to_jsonb(v_bloqueio));
end;
$$;

revoke all on function public.criar_bloqueio_horario(date,time,time,text,uuid) from public;
grant execute on function public.criar_bloqueio_horario(date,time,time,text,uuid) to authenticated;

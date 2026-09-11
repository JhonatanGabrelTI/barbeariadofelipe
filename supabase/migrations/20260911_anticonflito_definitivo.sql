-- Proteção definitiva contra agendamentos simultâneos.
-- A função continua dando mensagens amigáveis; a constraint garante a integridade
-- mesmo se duas requisições chegarem exatamente no mesmo instante.

create extension if not exists btree_gist;

-- Corrige o valor digitado incorretamente no cadastro de serviços.
update public.servicos
set duracao_minutos = 10, updated_at = now()
where nome = 'Sobrancelhas' and duracao_minutos = 3;

create or replace function public.intervalo_agendamento(
    p_data_hora timestamptz,
    p_duracao_minutos integer
)
returns int8range
language sql
immutable
strict
parallel safe
set search_path=pg_catalog
as $$
    select int8range(
        extract(epoch from p_data_hora)::bigint,
        extract(epoch from p_data_hora)::bigint + p_duracao_minutos::bigint * 60,
        '[)'
    );
$$;

alter table public.agendamentos
    drop constraint if exists agendamentos_sem_sobreposicao_confirmada;

alter table public.agendamentos
    add constraint agendamentos_sem_sobreposicao_confirmada
    exclude using gist (
        barbeiro_id with =,
        public.intervalo_agendamento(data_hora,duracao_minutos) with &&
    )
    where (status = 'confirmado');

create or replace function public.agendar_horario_com_barbeiro(
    p_user_id uuid,p_nome_cliente text,p_whatsapp text,p_servico text,
    p_data_hora timestamptz,p_duracao_minutos integer,p_barbeiro_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
    v_agendamento public.agendamentos;
    v_duracao integer;
    v_fim timestamptz;
    v_whatsapp text;
    v_inicio_local timestamp;
    v_fim_local timestamp;
begin
    v_whatsapp:=regexp_replace(coalesce(p_whatsapp,''),'\D','','g');
    if nullif(trim(coalesce(p_nome_cliente,'')),'') is null or length(v_whatsapp)<10 then
        return jsonb_build_object('success',false,'message','Preencha seus dados corretamente.');
    end if;
    if exists(select 1 from public.blocked_clients c
      where regexp_replace(c.whatsapp,'\D','','g')=v_whatsapp) then
        return jsonb_build_object('success',false,'message','Não foi possível concluir este agendamento.');
    end if;
    if not exists(select 1 from public.barbeiros where id=p_barbeiro_id and ativo=true) then
        return jsonb_build_object('success',false,'message','Profissional indisponível.');
    end if;

    -- A duração sempre vem do cadastro oficial do serviço, nunca do aparelho do cliente.
    select s.duracao_minutos into v_duracao from public.servicos s
      where s.nome=p_servico and s.ativo=true limit 1;
    if v_duracao is null or v_duracao<=0 then
        return jsonb_build_object('success',false,'message','Serviço inválido ou indisponível.');
    end if;

    v_fim:=p_data_hora+make_interval(mins=>v_duracao);
    v_inicio_local:=p_data_hora at time zone 'America/Sao_Paulo';
    v_fim_local:=v_fim at time zone 'America/Sao_Paulo';

    if p_data_hora<=now() then
        return jsonb_build_object('success',false,'message','Não é possível agendar um horário que já passou.');
    end if;
    if p_data_hora>now()+interval '90 days' then
        return jsonb_build_object('success',false,'message','Escolha uma data dentro dos próximos 90 dias.');
    end if;
    if extract(dow from v_inicio_local)=0 then
        return jsonb_build_object('success',false,'message','A barbearia não abre aos domingos.');
    end if;
    if extract(second from v_inicio_local)<>0
       or extract(minute from v_inicio_local) not in (0,30) then
        return jsonb_build_object('success',false,'message','Escolha um dos horários disponíveis.');
    end if;
    if v_inicio_local::time<time '09:00'
       or v_fim_local::date<>v_inicio_local::date
       or v_fim_local::time>time '20:00' then
        return jsonb_build_object('success',false,'message','O serviço não cabe no horário de funcionamento.');
    end if;

    -- Serializa todas as reservas do mesmo profissional e dia.
    perform pg_advisory_xact_lock(hashtextextended(
        p_barbeiro_id::text||v_inicio_local::date::text,0
    ));

    if exists(select 1 from public.agendamentos a where a.barbeiro_id=p_barbeiro_id
      and a.status<>'cancelado'
      and p_data_hora<a.data_hora+make_interval(mins=>coalesce(a.duracao_minutos,30))
      and v_fim>a.data_hora) then
        return jsonb_build_object('success',false,'message','Este horário acabou de ser ocupado. Escolha outro.');
    end if;
    if exists(select 1 from public.blocked_slots b where b.barbeiro_id=p_barbeiro_id
      and b.data=v_inicio_local::date
      and v_inicio_local::time<b.hora_fim
      and v_fim_local::time>b.hora_inicio) then
        return jsonb_build_object('success',false,'message','Este horário está bloqueado pelo profissional.');
    end if;

    insert into public.agendamentos(user_id,nome_cliente,whatsapp,servico,data_hora,duracao_minutos,barbeiro_id,status)
    values(auth.uid(),trim(p_nome_cliente),v_whatsapp,p_servico,p_data_hora,v_duracao,p_barbeiro_id,'confirmado')
    returning * into v_agendamento;
    return jsonb_build_object('success',true,'data',to_jsonb(v_agendamento));
exception
    when exclusion_violation then
        return jsonb_build_object('success',false,'message','Este horário acabou de ser ocupado. Escolha outro.');
end;
$$;

revoke all on function public.agendar_horario_com_barbeiro(uuid,text,text,text,timestamptz,integer,uuid) from public;
grant execute on function public.agendar_horario_com_barbeiro(uuid,text,text,text,timestamptz,integer,uuid) to anon,authenticated;

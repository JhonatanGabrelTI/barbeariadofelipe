-- Camada adicional de integridade. Estas regras também protegem gravações feitas
-- fora do fluxo normal do site, sem modificar registros históricos.

create extension if not exists btree_gist;

alter table public.agendamentos
    drop constraint if exists agendamentos_futuros_sem_sobreposicao;

alter table public.agendamentos
    add constraint agendamentos_futuros_sem_sobreposicao
    exclude using gist (
        barbeiro_id with =,
        public.intervalo_agendamento(data_hora,duracao_minutos) with &&
    )
    where (
        status <> 'cancelado'
        and data_hora >= timestamptz '2026-09-15 00:00:00-03:00'
    );

create or replace function public.proteger_agendamento()
returns trigger
language plpgsql
set search_path=public
as $$
declare
    v_duracao integer;
    v_inicio_local timestamp;
    v_fim_local timestamp;
begin
    if new.status='cancelado' then
        return new;
    end if;

    -- Concluir um atendimento deve ser uma troca simples de estado. Assim, um
    -- serviço desativado depois da marcação não impede o barbeiro de concluí-lo.
    if tg_op='UPDATE'
       and old.status='confirmado'
       and new.status='realizado'
       and (new.data_hora,new.duracao_minutos,new.barbeiro_id,new.servico,new.nome_cliente,new.whatsapp)
           is not distinct from
           (old.data_hora,old.duracao_minutos,old.barbeiro_id,old.servico,old.nome_cliente,old.whatsapp) then
        return new;
    end if;

    if nullif(trim(coalesce(new.nome_cliente,'')),'') is null
       or length(regexp_replace(coalesce(new.whatsapp,''),'\D','','g'))<10 then
        raise exception 'Dados do cliente inválidos.' using errcode='23514';
    end if;

    if not exists(select 1 from public.barbeiros b where b.id=new.barbeiro_id and b.ativo=true) then
        raise exception 'Profissional indisponível.' using errcode='23514';
    end if;

    select s.duracao_minutos into v_duracao
      from public.servicos s
     where s.nome=new.servico and s.ativo=true
     limit 1;
    if v_duracao is null or v_duracao<=0 then
        raise exception 'Serviço inválido ou indisponível.' using errcode='23514';
    end if;

    -- Nenhum cliente ou integração pode escolher uma duração diferente da oficial.
    new.duracao_minutos:=v_duracao;
    new.whatsapp:=regexp_replace(new.whatsapp,'\D','','g');
    v_inicio_local:=new.data_hora at time zone 'America/Sao_Paulo';
    v_fim_local:=(new.data_hora+make_interval(mins=>v_duracao)) at time zone 'America/Sao_Paulo';

    if new.data_hora<=now() then
        raise exception 'Não é possível gravar um atendimento em um horário que já passou.' using errcode='23514';
    end if;
    if extract(dow from v_inicio_local)=0
       or extract(second from v_inicio_local)<>0
       or extract(minute from v_inicio_local) not in (0,30)
       or v_inicio_local::time<time '09:00'
       or v_fim_local::date<>v_inicio_local::date
       or v_fim_local::time>time '20:00' then
        raise exception 'Horário fora do expediente da barbearia.' using errcode='23514';
    end if;

    if exists(
        select 1 from public.blocked_slots b
         where b.barbeiro_id=new.barbeiro_id
           and b.data=v_inicio_local::date
           and v_inicio_local::time<b.hora_fim
           and v_fim_local::time>b.hora_inicio
    ) then
        raise exception 'O horário está bloqueado pelo profissional.' using errcode='23P01';
    end if;

    return new;
end;
$$;

drop trigger if exists proteger_agendamento_trigger on public.agendamentos;
create trigger proteger_agendamento_trigger
before insert or update of data_hora,duracao_minutos,barbeiro_id,servico,nome_cliente,whatsapp,status
on public.agendamentos
for each row execute function public.proteger_agendamento();

create or replace function public.proteger_bloqueio_horario()
returns trigger
language plpgsql
set search_path=public
as $$
declare
    v_inicio timestamptz;
    v_fim timestamptz;
    v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
    if new.data<v_hoje or new.data>v_hoje+90 or extract(dow from new.data)=0 then
        raise exception 'Data de bloqueio inválida.' using errcode='23514';
    end if;
    if new.hora_inicio>=new.hora_fim
       or new.hora_inicio<time '09:00'
       or new.hora_fim>time '20:00'
       or extract(second from new.hora_inicio)<>0
       or extract(second from new.hora_fim)<>0
       or extract(minute from new.hora_inicio) not in (0,30)
       or extract(minute from new.hora_fim) not in (0,30) then
        raise exception 'Intervalo de bloqueio inválido.' using errcode='23514';
    end if;
    if not exists(select 1 from public.barbeiros b where b.id=new.barbeiro_id and b.ativo=true) then
        raise exception 'Profissional indisponível.' using errcode='23514';
    end if;

    v_inicio:=(new.data+new.hora_inicio) at time zone 'America/Sao_Paulo';
    v_fim:=(new.data+new.hora_fim) at time zone 'America/Sao_Paulo';
    if v_fim<=now() then
        raise exception 'O intervalo de bloqueio já passou.' using errcode='23514';
    end if;

    if exists(
        select 1 from public.blocked_slots b
         where b.barbeiro_id=new.barbeiro_id and b.data=new.data
           and b.id is distinct from new.id
           and new.hora_inicio<b.hora_fim and new.hora_fim>b.hora_inicio
    ) then
        raise exception 'Já existe um bloqueio nesse intervalo.' using errcode='23P01';
    end if;
    if exists(
        select 1 from public.agendamentos a
         where a.barbeiro_id=new.barbeiro_id and a.status<>'cancelado'
           and v_inicio<a.data_hora+make_interval(mins=>coalesce(a.duracao_minutos,30))
           and v_fim>a.data_hora
    ) then
        raise exception 'Já existe um cliente agendado nesse intervalo.' using errcode='23P01';
    end if;

    new.motivo:=coalesce(nullif(trim(new.motivo),''),'Pausa');
    return new;
end;
$$;

drop trigger if exists proteger_bloqueio_horario_trigger on public.blocked_slots;
create trigger proteger_bloqueio_horario_trigger
before insert or update of data,hora_inicio,hora_fim,barbeiro_id,motivo
on public.blocked_slots
for each row execute function public.proteger_bloqueio_horario();

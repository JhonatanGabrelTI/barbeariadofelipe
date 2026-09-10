-- Suporte a múltiplos barbeiros, com Felipe como dono e Eliabner como barbeiro.
-- Execute no SQL Editor do Supabase antes de publicar a nova versão do site.

create table if not exists public.barbeiros (
    id uuid primary key,
    nome text not null,
    email text unique,
    foto_url text,
    user_id uuid unique references auth.users(id) on delete set null,
    role text not null default 'barbeiro' check (role in ('dono', 'barbeiro')),
    ativo boolean not null default true,
    created_at timestamptz not null default now()
);

insert into public.barbeiros (id, nome, email, foto_url, role)
values
    ('00000000-0000-4000-8000-000000000001', 'Felipe', 'barbeariadofelipe2020@gmail.com', '/barbeiros/felipe.png', 'dono'),
    ('00000000-0000-4000-8000-000000000002', 'Eliabner', 'eliabnerbarbeiro@gmail.com', '/barbeiros/eliabner.png', 'barbeiro')
on conflict (id) do update set
    nome = excluded.nome,
    email = excluded.email,
    foto_url = excluded.foto_url,
    role = excluded.role,
    ativo = true;

-- Vincula automaticamente Felipe à conta que já existe.
update public.barbeiros b
set user_id = u.id
from auth.users u
where lower(u.email) = lower(b.email)
  and b.user_id is null;

alter table public.agendamentos
    add column if not exists barbeiro_id uuid references public.barbeiros(id);

update public.agendamentos
set barbeiro_id = '00000000-0000-4000-8000-000000000001'
where barbeiro_id is null;

alter table public.agendamentos
    alter column barbeiro_id set default '00000000-0000-4000-8000-000000000001',
    alter column barbeiro_id set not null;

alter table public.blocked_slots
    add column if not exists barbeiro_id uuid references public.barbeiros(id);

update public.blocked_slots
set barbeiro_id = '00000000-0000-4000-8000-000000000001'
where barbeiro_id is null;

alter table public.blocked_slots
    alter column barbeiro_id set default '00000000-0000-4000-8000-000000000001',
    alter column barbeiro_id set not null;

create index if not exists agendamentos_barbeiro_data_idx
    on public.agendamentos (barbeiro_id, data_hora);
create index if not exists blocked_slots_barbeiro_data_idx
    on public.blocked_slots (barbeiro_id, data);

-- Funções auxiliares evitam recursão nas políticas de segurança.
create or replace function public.current_barbeiro_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select id
    from public.barbeiros
    where ativo = true
      and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    limit 1;
$$;

create or replace function public.is_barbearia_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.barbeiros
        where ativo = true
          and role = 'dono'
          and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email'))
    );
$$;

revoke all on function public.current_barbeiro_id() from public;
revoke all on function public.is_barbearia_owner() from public;
grant execute on function public.current_barbeiro_id() to authenticated;
grant execute on function public.is_barbearia_owner() to authenticated;

alter table public.barbeiros enable row level security;

drop policy if exists "barbeiros_staff_select" on public.barbeiros;
create policy "barbeiros_staff_select"
on public.barbeiros for select
to authenticated
using (public.is_barbearia_owner() or id = public.current_barbeiro_id());

-- Estas políticas complementam as existentes: o dono acessa tudo e cada barbeiro só o próprio.
drop policy if exists "staff_select_appointments" on public.agendamentos;
create policy "staff_select_appointments"
on public.agendamentos for select
to authenticated
using (public.is_barbearia_owner() or barbeiro_id = public.current_barbeiro_id());

drop policy if exists "staff_update_appointments" on public.agendamentos;
create policy "staff_update_appointments"
on public.agendamentos for update
to authenticated
using (public.is_barbearia_owner() or barbeiro_id = public.current_barbeiro_id())
with check (public.is_barbearia_owner() or barbeiro_id = public.current_barbeiro_id());

drop policy if exists "staff_manage_own_blocked_slots" on public.blocked_slots;
create policy "staff_manage_own_blocked_slots"
on public.blocked_slots for all
to authenticated
using (public.is_barbearia_owner() or barbeiro_id = public.current_barbeiro_id())
with check (public.is_barbearia_owner() or barbeiro_id = public.current_barbeiro_id());

-- Reserva de horário atômica e separada por profissional.
create or replace function public.agendar_horario_com_barbeiro(
    p_user_id uuid,
    p_nome_cliente text,
    p_whatsapp text,
    p_servico text,
    p_data_hora timestamptz,
    p_duracao_minutos integer,
    p_barbeiro_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_agendamento public.agendamentos;
    v_fim timestamptz;
begin
    if not exists (select 1 from public.barbeiros where id = p_barbeiro_id and ativo = true) then
        return jsonb_build_object('success', false, 'message', 'Profissional indisponível.');
    end if;

    if coalesce(p_duracao_minutos, 0) <= 0 then
        return jsonb_build_object('success', false, 'message', 'Duração inválida.');
    end if;

    v_fim := p_data_hora + make_interval(mins => p_duracao_minutos);
    perform pg_advisory_xact_lock(hashtextextended(p_barbeiro_id::text || p_data_hora::date::text, 0));

    if exists (
        select 1
        from public.agendamentos a
        where a.barbeiro_id = p_barbeiro_id
          and a.status <> 'cancelado'
          and p_data_hora < a.data_hora + make_interval(mins => coalesce(a.duracao_minutos, 30))
          and v_fim > a.data_hora
    ) then
        return jsonb_build_object('success', false, 'message', 'Este horário acabou de ser ocupado. Escolha outro.');
    end if;

    if exists (
        select 1
        from public.blocked_slots b
        where b.barbeiro_id = p_barbeiro_id
          and b.data = (p_data_hora at time zone 'America/Sao_Paulo')::date
          and (p_data_hora at time zone 'America/Sao_Paulo')::time < b.hora_fim::time
          and (v_fim at time zone 'America/Sao_Paulo')::time > b.hora_inicio::time
    ) then
        return jsonb_build_object('success', false, 'message', 'Este horário está bloqueado pelo profissional.');
    end if;

    insert into public.agendamentos (
        user_id, nome_cliente, whatsapp, servico, data_hora, duracao_minutos, barbeiro_id, status
    ) values (
        auth.uid(), nullif(trim(p_nome_cliente), ''), p_whatsapp, p_servico,
        p_data_hora, p_duracao_minutos, p_barbeiro_id, 'confirmado'
    ) returning * into v_agendamento;

    return jsonb_build_object('success', true, 'data', to_jsonb(v_agendamento));
end;
$$;

grant execute on function public.agendar_horario_com_barbeiro(uuid, text, text, text, timestamptz, integer, uuid)
to anon, authenticated;

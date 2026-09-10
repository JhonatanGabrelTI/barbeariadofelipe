-- Instalação completa do banco da Felipe Barbearia.
-- Pode ser executada tanto no banco antigo quanto em um projeto Supabase vazio.

create extension if not exists pgcrypto;

create table if not exists public.servicos (
    id uuid primary key default gen_random_uuid(), nome text not null unique,
    preco numeric(10,2) not null check (preco >= 0),
    duracao_minutos integer not null default 30 check (duracao_minutos > 0),
    popular boolean not null default false, ativo boolean not null default true,
    ordem integer not null default 0, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.produtos (
    id uuid primary key default gen_random_uuid(), nome text not null, descricao text,
    preco numeric(10,2) not null check (preco >= 0),
    estoque integer not null default 0 check (estoque >= 0),
    categoria text not null default 'Outros', ativo boolean not null default true,
    imagem_url text, created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.agendamentos (
    id uuid primary key default gen_random_uuid(), user_id uuid, nome_cliente text,
    whatsapp text not null, servico text not null, data_hora timestamptz not null,
    status text not null default 'confirmado' check (status in ('confirmado', 'cancelado', 'realizado')),
    lembrete_enviado boolean not null default false,
    whatsapp_notificado boolean not null default false,
    duracao_minutos integer not null default 30 check (duracao_minutos > 0),
    created_at timestamptz not null default now()
);

create table if not exists public.blocked_slots (
    id uuid primary key default gen_random_uuid(), data date not null,
    hora_inicio time not null, hora_fim time not null,
    motivo text not null default 'Bloqueado', created_by uuid,
    created_at timestamptz not null default now(), check (hora_fim > hora_inicio)
);

create table if not exists public.blocked_clients (
    id uuid primary key default gen_random_uuid(), whatsapp text not null unique,
    nome text, motivo text not null, created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_config (
    id uuid primary key default gen_random_uuid(), instance_id text not null default '',
    instance_token text not null default '', client_token text not null default '',
    z_api_url text not null default 'https://api.z-api.io/instances/',
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.admin_emails (email text primary key);

create table if not exists public.barbeiros (
    id uuid primary key, nome text not null, email text unique, foto_url text,
    user_id uuid unique references auth.users(id) on delete set null,
    role text not null default 'barbeiro' check (role in ('dono', 'barbeiro')),
    ativo boolean not null default true, created_at timestamptz not null default now()
);

insert into public.barbeiros (id, nome, email, foto_url, role) values
    ('00000000-0000-4000-8000-000000000001', 'Felipe', 'barbeariadofelipe2020@gmail.com', '/barbeiros/felipe.png', 'dono'),
    ('00000000-0000-4000-8000-000000000002', 'Eliabner', 'eliabnerbarbeiro@gmail.com', '/barbeiros/eliabner.png', 'barbeiro')
on conflict (id) do update set nome=excluded.nome, email=excluded.email,
    foto_url=excluded.foto_url, role=excluded.role, ativo=true;

insert into public.admin_emails (email) values ('barbeariadofelipe2020@gmail.com')
on conflict (email) do nothing;

update public.barbeiros b set user_id=u.id from auth.users u
where lower(u.email)=lower(b.email) and b.user_id is distinct from u.id;

alter table public.agendamentos add column if not exists barbeiro_id uuid references public.barbeiros(id);
update public.agendamentos set barbeiro_id='00000000-0000-4000-8000-000000000001' where barbeiro_id is null;
alter table public.agendamentos
    alter column barbeiro_id set default '00000000-0000-4000-8000-000000000001',
    alter column barbeiro_id set not null;

alter table public.blocked_slots add column if not exists barbeiro_id uuid references public.barbeiros(id);
update public.blocked_slots set barbeiro_id='00000000-0000-4000-8000-000000000001' where barbeiro_id is null;
alter table public.blocked_slots
    alter column barbeiro_id set default '00000000-0000-4000-8000-000000000001',
    alter column barbeiro_id set not null;

create index if not exists agendamentos_barbeiro_data_idx on public.agendamentos (barbeiro_id,data_hora);
create index if not exists agendamentos_user_idx on public.agendamentos (user_id);
create index if not exists blocked_slots_barbeiro_data_idx on public.blocked_slots (barbeiro_id,data);

create or replace function public.current_barbeiro_id() returns uuid language sql stable security definer
set search_path=public as $$
    select id from public.barbeiros where ativo=true
      and (user_id=auth.uid() or lower(email)=lower(auth.jwt()->>'email')) limit 1;
$$;

create or replace function public.is_barbearia_owner() returns boolean language sql stable security definer
set search_path=public as $$
    select exists(select 1 from public.barbeiros where ativo=true and role='dono'
      and (user_id=auth.uid() or lower(email)=lower(auth.jwt()->>'email')));
$$;

revoke all on function public.current_barbeiro_id() from public;
revoke all on function public.is_barbearia_owner() from public;
grant execute on function public.current_barbeiro_id() to authenticated;
grant execute on function public.is_barbearia_owner() to authenticated;

create or replace function public.listar_barbeiros_publicos()
returns table (id uuid,nome text,foto_url text) language sql stable security definer
set search_path=public as $$
    select b.id,b.nome,b.foto_url from public.barbeiros b where b.ativo=true
    order by case when b.role='dono' then 0 else 1 end,b.nome;
$$;
grant execute on function public.listar_barbeiros_publicos() to anon,authenticated;

create or replace function public.listar_agendamentos_publicos(
    p_inicio timestamptz,p_fim timestamptz,p_barbeiro_id uuid)
returns table (data_hora timestamptz,servico text,status text,duracao_minutos integer,barbeiro_id uuid)
language sql stable security definer set search_path=public as $$
    select a.data_hora,a.servico,a.status,a.duracao_minutos,a.barbeiro_id
    from public.agendamentos a where a.data_hora>=p_inicio and a.data_hora<=p_fim
      and a.status<>'cancelado' and a.barbeiro_id=p_barbeiro_id;
$$;
grant execute on function public.listar_agendamentos_publicos(timestamptz,timestamptz,uuid) to anon,authenticated;

alter table public.barbeiros enable row level security;
alter table public.agendamentos enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.blocked_clients enable row level security;
alter table public.servicos enable row level security;
alter table public.produtos enable row level security;
alter table public.whatsapp_config enable row level security;
alter table public.admin_emails enable row level security;

drop policy if exists "barbeiros_staff_select" on public.barbeiros;
create policy "barbeiros_staff_select" on public.barbeiros for select to authenticated
using (public.is_barbearia_owner() or id=public.current_barbeiro_id());

drop policy if exists "staff_select_appointments" on public.agendamentos;
create policy "staff_select_appointments" on public.agendamentos for select to authenticated
using (user_id=auth.uid() or public.is_barbearia_owner() or barbeiro_id=public.current_barbeiro_id());

drop policy if exists "staff_update_appointments" on public.agendamentos;
create policy "staff_update_appointments" on public.agendamentos for update to authenticated
using (user_id=auth.uid() or public.is_barbearia_owner() or barbeiro_id=public.current_barbeiro_id())
with check (user_id=auth.uid() or public.is_barbearia_owner() or barbeiro_id=public.current_barbeiro_id());

drop policy if exists "public_read_blocked_slots" on public.blocked_slots;
create policy "public_read_blocked_slots" on public.blocked_slots for select to anon,authenticated using (true);
drop policy if exists "staff_manage_own_blocked_slots" on public.blocked_slots;
create policy "staff_manage_own_blocked_slots" on public.blocked_slots for all to authenticated
using (public.is_barbearia_owner() or barbeiro_id=public.current_barbeiro_id())
with check (public.is_barbearia_owner() or barbeiro_id=public.current_barbeiro_id());

drop policy if exists "staff_manage_blocked_clients" on public.blocked_clients;
create policy "staff_manage_blocked_clients" on public.blocked_clients for all to authenticated
using (public.current_barbeiro_id() is not null) with check (public.current_barbeiro_id() is not null);

drop policy if exists "public_read_servicos" on public.servicos;
create policy "public_read_servicos" on public.servicos for select to anon,authenticated using (true);
drop policy if exists "owner_manage_servicos" on public.servicos;
create policy "owner_manage_servicos" on public.servicos for all to authenticated
using (public.is_barbearia_owner()) with check (public.is_barbearia_owner());

drop policy if exists "public_read_produtos" on public.produtos;
create policy "public_read_produtos" on public.produtos for select to anon,authenticated using (true);
drop policy if exists "owner_manage_produtos" on public.produtos;
create policy "owner_manage_produtos" on public.produtos for all to authenticated
using (public.is_barbearia_owner()) with check (public.is_barbearia_owner());

drop policy if exists "owner_manage_whatsapp" on public.whatsapp_config;
create policy "owner_manage_whatsapp" on public.whatsapp_config for all to authenticated
using (public.is_barbearia_owner()) with check (public.is_barbearia_owner());

drop policy if exists "staff_read_admin_email" on public.admin_emails;
create policy "staff_read_admin_email" on public.admin_emails for select to authenticated
using (lower(email)=lower(auth.jwt()->>'email') or public.is_barbearia_owner());

grant usage on schema public to anon,authenticated;
grant select on public.servicos,public.produtos to anon,authenticated;
grant select on public.blocked_slots to anon,authenticated;
grant select on public.agendamentos to authenticated;
grant update (status) on public.agendamentos to authenticated;
grant select on public.barbeiros,public.blocked_clients,public.whatsapp_config,public.admin_emails to authenticated;
grant insert,update,delete on public.servicos,public.produtos,public.blocked_slots,public.blocked_clients,public.whatsapp_config to authenticated;

create or replace function public.agendar_horario_com_barbeiro(
    p_user_id uuid,p_nome_cliente text,p_whatsapp text,p_servico text,
    p_data_hora timestamptz,p_duracao_minutos integer,p_barbeiro_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
    v_agendamento public.agendamentos; v_duracao integer; v_fim timestamptz; v_whatsapp text;
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
    select s.duracao_minutos into v_duracao from public.servicos s
      where s.nome=p_servico and s.ativo=true limit 1;
    if v_duracao is null then v_duracao:=greatest(coalesce(p_duracao_minutos,0),0); end if;
    if v_duracao<=0 then return jsonb_build_object('success',false,'message','Serviço inválido.'); end if;
    v_fim:=p_data_hora+make_interval(mins=>v_duracao);
    perform pg_advisory_xact_lock(hashtextextended(p_barbeiro_id::text||p_data_hora::date::text,0));
    if exists(select 1 from public.agendamentos a where a.barbeiro_id=p_barbeiro_id
      and a.status<>'cancelado' and p_data_hora<a.data_hora+make_interval(mins=>coalesce(a.duracao_minutos,30))
      and v_fim>a.data_hora) then
        return jsonb_build_object('success',false,'message','Este horário acabou de ser ocupado. Escolha outro.');
    end if;
    if exists(select 1 from public.blocked_slots b where b.barbeiro_id=p_barbeiro_id
      and b.data=(p_data_hora at time zone 'America/Sao_Paulo')::date
      and (p_data_hora at time zone 'America/Sao_Paulo')::time<b.hora_fim
      and (v_fim at time zone 'America/Sao_Paulo')::time>b.hora_inicio) then
        return jsonb_build_object('success',false,'message','Este horário está bloqueado pelo profissional.');
    end if;
    insert into public.agendamentos(user_id,nome_cliente,whatsapp,servico,data_hora,duracao_minutos,barbeiro_id,status)
    values(auth.uid(),trim(p_nome_cliente),v_whatsapp,p_servico,p_data_hora,v_duracao,p_barbeiro_id,'confirmado')
    returning * into v_agendamento;
    return jsonb_build_object('success',true,'data',to_jsonb(v_agendamento));
end;
$$;
grant execute on function public.agendar_horario_com_barbeiro(uuid,text,text,text,timestamptz,integer,uuid) to anon,authenticated;

do $$ begin
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='agendamentos') then
        alter publication supabase_realtime add table public.agendamentos;
    end if;
end $$;

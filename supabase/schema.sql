-- =====================================================================
--  PELONES CANTABRIA · Esquema de base de datos (Supabase / PostgreSQL)
--  Ejecutar completo en: Supabase → SQL Editor → New query → Run
--  Es idempotente: se puede volver a ejecutar sin romper datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PERFILES Y ROLES
--    user  = persona registrada (puede hacer pedidos y ver su historial)
--    staff = voluntario/trabajador (vende números de sorteo, ve pedidos)
--    admin = control total (activa la app de sorteos, publica, roles…)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text,
  phone       text,
  role        text not null default 'user' check (role in ('user','staff','admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;
create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.my_role() = 'admin' $$;
create or replace function public.is_staff() returns boolean
language sql stable as $$ select public.my_role() in ('staff','admin') $$;

-- Un usuario no puede subirse el rol a sí mismo
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ---------------------------------------------------------------------
-- 2. AJUSTES DEL SITIO (contacto, redes, interruptor de sorteos…)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('raffles_enabled', 'false'),
  ('contact_email',   '""'),
  ('whatsapp',        '""'),
  ('phone',           '""'),
  ('address',         '"Santander, Cantabria"'),
  ('facebook',        '"https://www.facebook.com/pelonescantabria/"'),
  ('instagram',       '"https://www.instagram.com/pelonescantabria/"'),
  ('twitter',         '"https://twitter.com/pelonescant"'),
  ('migranodearena',  '"https://www.migranodearena.org/usuario/pelones-cantabria"'),
  ('pay_bizum',       '""'),
  ('pay_iban',        '""'),
  ('pay_holder',      '"Asociación Pelones Cantabria"'),
  ('pay_card_url',    '""'),
  ('pay_cash',        'true')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3. CONTENIDO: productos, noticias, galería
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) <= 120),
  description text not null default '' check (char_length(description) <= 1500),
  category    text not null default 'pelones',
  price       numeric(8,2) check (price is null or price >= 0),
  image_url   text,
  colors      jsonb not null default '{}'::jsonb,   -- colores de la ilustración si no hay foto
  stock       text not null default 'disponible' check (stock in ('disponible','bajo_pedido','agotado')),
  featured    boolean not null default false,
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) <= 200),
  excerpt     text not null default '',
  body        text not null default '',
  kind        text not null default 'noticia' check (kind in ('noticia','logro','evento')),
  event_date  date,
  location    text,
  image_url   text,
  link        text,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  grp         text not null default 'Nos apoyan',
  url         text,
  logo_url    text,
  color       text not null default '#ec4f8e',
  sort        int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  category    text not null default 'eventos',
  image_url   text not null,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. PEDIDOS Y MENSAJES DE CONTACTO
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique default upper(substr(md5(random()::text),1,6)),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (char_length(phone) <= 30),
  delivery    text not null default 'recogida' check (delivery in ('recogida','envio')),
  address     text check (char_length(address) <= 400),
  notes       text check (char_length(notes) <= 1000),
  items       jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  total       numeric(10,2) not null default 0,
  status      text not null default 'nuevo' check (status in ('nuevo','confirmado','preparado','entregado','cancelado')),
  payment_method text not null default 'en_mano' check (payment_method in ('en_mano','bizum','transferencia','tarjeta')),
  paid        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Columnas de pago para bases de datos creadas con una versión anterior
alter table public.orders add column if not exists payment_method text not null default 'en_mano';
alter table public.orders add column if not exists paid boolean not null default false;

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (char_length(phone) <= 30),
  subject     text not null default 'general',
  message     text not null check (char_length(message) between 5 and 3000),
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Anti-spam: máximo 5 mensajes / 5 pedidos por email y hora
create or replace function public.throttle_by_email() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  execute format('select count(*) from public.%I where lower(email) = lower($1) and created_at > now() - interval ''1 hour''', TG_TABLE_NAME)
    into n using new.email;
  if n >= 5 then raise exception 'Demasiados envíos seguidos. Inténtalo dentro de un rato.'; end if;
  return new;
end $$;
drop trigger if exists throttle_messages on public.contact_messages;
create trigger throttle_messages before insert on public.contact_messages
  for each row execute function public.throttle_by_email();
drop trigger if exists throttle_orders on public.orders;
create trigger throttle_orders before insert on public.orders
  for each row execute function public.throttle_by_email();

-- El total del pedido se recalcula en el servidor con los precios reales
create or replace function public.order_compute_total() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb; p record; tot numeric := 0; clean jsonb := '[]'::jsonb; q int;
begin
  for it in select * from jsonb_array_elements(new.items) loop
    select id, name, price into p from public.products
      where id = (it->>'id')::uuid and active;
    if not found then raise exception 'Producto no disponible'; end if;
    q := greatest(1, least(99, coalesce((it->>'qty')::int, 1)));
    tot := tot + coalesce(p.price,0) * q;
    clean := clean || jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price, 'qty', q);
  end loop;
  new.items := clean;
  new.total := tot;
  if tg_op = 'INSERT' then
    new.status := 'nuevo';
    new.user_id := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists orders_total on public.orders;
create trigger orders_total before insert on public.orders
  for each row execute function public.order_compute_total();

-- Alta de pedido por RPC: devuelve código y total aunque quien compra
-- no tenga sesión (no puede leer la tabla orders). Los triggers de
-- validación, precio real y anti-spam se siguen aplicando.
drop function if exists public.create_order(text,text,text,text,text,text,jsonb);
create or replace function public.create_order(
  p_name text, p_email text, p_phone text, p_delivery text, p_address text,
  p_notes text, p_items jsonb, p_payment text default 'en_mano')
returns table(code text, total numeric) language plpgsql security definer set search_path = public as $$
declare new_id uuid := gen_random_uuid();
begin
  insert into public.orders (id, name, email, phone, delivery, address, notes, items, payment_method)
    values (new_id, trim(p_name), trim(p_email), p_phone, coalesce(p_delivery,'recogida'), p_address, p_notes, p_items, coalesce(p_payment,'en_mano'));
  return query select o.code, o.total from public.orders o where o.id = new_id;
end $$;
grant execute on function public.create_order(text,text,text,text,text,text,jsonb,text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. SORTEOS
--    raffles                 → datos del sorteo (solo admin crea/edita)
--    raffle_tickets          → números vendidos, PÚBLICO (nombre abreviado)
--    raffle_ticket_contacts  → datos personales del comprador, PRIVADO
--    raffle_winners          → premiados (visibles solo si se publican)
-- ---------------------------------------------------------------------
create table if not exists public.raffles (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  ticket_price    numeric(8,2) not null default 1,
  number_start    int not null default 1,
  total_numbers   int not null default 100 check (total_numbers between 1 and 10000),
  draw_date       timestamptz,
  location        text,
  status          text not null default 'preparacion' check (status in ('preparacion','venta','cerrado','sorteado')),
  published       boolean not null default false,
  results_published boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists public.raffle_tickets (
  raffle_id     uuid not null references public.raffles(id) on delete cascade,
  number        int  not null,
  holder_label  text not null default '',
  status        text not null default 'vendido' check (status in ('vendido','reservado')),
  sold_by       uuid references auth.users(id) on delete set null,
  sold_at       timestamptz not null default now(),
  primary key (raffle_id, number)
);

create table if not exists public.raffle_ticket_contacts (
  raffle_id   uuid not null,
  number      int  not null,
  full_name   text not null,
  phone       text,
  email       text,
  paid        boolean not null default true,
  notes       text,
  primary key (raffle_id, number),
  foreign key (raffle_id, number) references public.raffle_tickets(raffle_id, number) on delete cascade
);

create table if not exists public.raffle_winners (
  id          uuid primary key default gen_random_uuid(),
  raffle_id   uuid not null references public.raffles(id) on delete cascade,
  position    int not null default 1,
  prize       text not null,
  winner_name text not null default '',
  number      int,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Venta atómica de un número (evita que dos voluntarios vendan el mismo a la vez)
create or replace function public.sell_ticket(
  p_raffle uuid, p_number int, p_full_name text, p_phone text default null,
  p_email text default null, p_paid boolean default true, p_status text default 'vendido',
  p_notes text default null, p_overwrite boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare r record; lbl text; parts text[];
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  select * into r from public.raffles where id = p_raffle;
  if not found then raise exception 'Sorteo no encontrado'; end if;
  if p_number < r.number_start or p_number >= r.number_start + r.total_numbers then
    raise exception 'El número % no existe en este sorteo', p_number;
  end if;
  if coalesce(trim(p_full_name),'') = '' then raise exception 'Falta el nombre del comprador'; end if;
  parts := regexp_split_to_array(trim(p_full_name), '\s+');
  lbl := parts[1] || case when array_length(parts,1) > 1 then ' ' || upper(left(parts[2],1)) || '.' else '' end;

  if exists (select 1 from public.raffle_tickets where raffle_id = p_raffle and number = p_number) then
    if not p_overwrite then raise exception 'El número % ya está vendido', p_number; end if;
    update public.raffle_tickets set holder_label = lbl, status = p_status, sold_by = auth.uid(), sold_at = now()
      where raffle_id = p_raffle and number = p_number;
  else
    insert into public.raffle_tickets (raffle_id, number, holder_label, status, sold_by)
      values (p_raffle, p_number, lbl, p_status, auth.uid());
  end if;

  insert into public.raffle_ticket_contacts (raffle_id, number, full_name, phone, email, paid, notes)
    values (p_raffle, p_number, trim(p_full_name), p_phone, p_email, p_paid, p_notes)
  on conflict (raffle_id, number) do update
    set full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
        paid = excluded.paid, notes = excluded.notes;
end $$;

create or replace function public.release_ticket(p_raffle uuid, p_number int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  delete from public.raffle_tickets where raffle_id = p_raffle and number = p_number;
end $$;

-- ---------------------------------------------------------------------
-- 6. SEGURIDAD (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.settings               enable row level security;
alter table public.products               enable row level security;
alter table public.news                   enable row level security;
alter table public.gallery                enable row level security;
alter table public.partners               enable row level security;
alter table public.orders                 enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.raffles                enable row level security;
alter table public.raffle_tickets         enable row level security;
alter table public.raffle_ticket_contacts enable row level security;
alter table public.raffle_winners         enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles
create policy profiles_self_read   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
-- settings
create policy settings_read  on public.settings for select using (true);
create policy settings_write on public.settings for all using (public.is_admin()) with check (public.is_admin());
-- products / news / gallery
create policy products_read  on public.products for select using (active or public.is_staff());
create policy products_write on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy news_read      on public.news for select using (published or public.is_staff());
create policy news_write     on public.news for all using (public.is_admin()) with check (public.is_admin());
create policy gallery_read   on public.gallery for select using (published or public.is_staff());
create policy gallery_write  on public.gallery for all using (public.is_admin()) with check (public.is_admin());
create policy partners_read  on public.partners for select using (active or public.is_staff());
create policy partners_write on public.partners for all using (public.is_admin()) with check (public.is_admin());
-- orders
create policy orders_insert  on public.orders for insert with check (true);
create policy orders_read    on public.orders for select using (public.is_staff() or user_id = auth.uid());
create policy orders_update  on public.orders for update using (public.is_staff());
create policy orders_delete  on public.orders for delete using (public.is_admin());
-- contact
create policy contact_insert on public.contact_messages for insert with check (true);
create policy contact_read   on public.contact_messages for select using (public.is_staff());
create policy contact_update on public.contact_messages for update using (public.is_staff());
create policy contact_delete on public.contact_messages for delete using (public.is_admin());
-- raffles (público solo si la app está activada y el sorteo publicado)
create policy raffles_read on public.raffles for select using (
  public.is_staff() or (published and (select value = 'true'::jsonb from public.settings where key = 'raffles_enabled')));
create policy raffles_write on public.raffles for all using (public.is_admin()) with check (public.is_admin());
create policy tickets_read on public.raffle_tickets for select using (
  public.is_staff() or exists (select 1 from public.raffles r where r.id = raffle_id and r.published
    and (select value = 'true'::jsonb from public.settings where key = 'raffles_enabled')));
create policy tickets_staff_write on public.raffle_tickets for all using (public.is_staff()) with check (public.is_staff());
create policy contacts_staff on public.raffle_ticket_contacts for all using (public.is_staff()) with check (public.is_staff());
create policy winners_read on public.raffle_winners for select using (
  public.is_staff() or (published and exists (select 1 from public.raffles r where r.id = raffle_id
    and r.published and r.results_published
    and (select value = 'true'::jsonb from public.settings where key = 'raffles_enabled'))));
create policy winners_write on public.raffle_winners for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. TIEMPO REAL (tablas de sorteo y ajustes se actualizan en directo)
-- ---------------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.raffle_tickets; exception when others then null; end;
  begin alter publication supabase_realtime add table public.raffle_winners; exception when others then null; end;
  begin alter publication supabase_realtime add table public.raffles;        exception when others then null; end;
  begin alter publication supabase_realtime add table public.settings;       exception when others then null; end;
end $$;
alter table public.raffle_tickets replica identity full;

-- ---------------------------------------------------------------------
-- 8. ALMACENAMIENTO DE IMÁGENES (bucket público "media")
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media','media', true)
  on conflict (id) do nothing;
drop policy if exists media_public_read  on storage.objects;
drop policy if exists media_admin_write  on storage.objects;
drop policy if exists media_admin_delete on storage.objects;
create policy media_public_read  on storage.objects for select using (bucket_id = 'media');
create policy media_admin_write  on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy media_admin_delete on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- 9. CONTENIDO INICIAL (solo si las tablas están vacías)
--    Los precios son orientativos: cámbialos desde el panel → Productos.
-- ---------------------------------------------------------------------
insert into public.products (name, description, category, price, colors, featured, sort)
select * from (values
  ('Pelón clásico', 'El de siempre: pañuelo azul de olas y nudo rosa. Hecho a mano, uno a uno, por el equipo de voluntarios.', 'muñecos', 5.00, '{"theme":"clasico"}'::jsonb, true, 1),
  ('Pelón rosa', 'Pañuelo rosa con olas blancas. Cada pelón es único: ninguno sale exactamente igual que otro.', 'muñecos', 5.00, '{"theme":"rosa"}'::jsonb, true, 2),
  ('Pelón racinguista', 'Verde y blanco de pies a cabeza, con su balón. Para la afición del Racing que también juega por los niños.', 'equipos', 5.00, '{"theme":"racing"}'::jsonb, true, 3),
  ('Pelón de la Selección', 'Rojo y gualda para animar a España en cada partido… y a los peques en cada tratamiento.', 'equipos', 5.00, '{"theme":"espana"}'::jsonb, true, 4),
  ('Pelón cántabro', 'Con los colores de la bandera de Cantabria. Orgullo de tierruca.', 'muñecos', 5.00, '{"theme":"cantabria"}'::jsonb, false, 5),
  ('Pelón navideño', 'Pañuelo rojo de estrellas con pompón. El detalle solidario perfecto para el árbol o el amigo invisible.', 'temporada', 5.00, '{"theme":"navidad"}'::jsonb, true, 6),
  ('Pelón de lunares', 'Pañuelo flamenco con flor. Para las ferias y para quien lleva el arte dentro.', 'muñecos', 5.00, '{"theme":"flamenco"}'::jsonb, false, 7),
  ('Pelón de las estrellas', 'Azul noche con estrellas doradas, para soñar a lo grande.', 'muñecos', 5.00, '{"theme":"estrellas"}'::jsonb, false, 8),
  ('Pelón de corazones', 'Rosa clarito con corazones. Un abrazo que se puede regalar.', 'muñecos', 5.00, '{"theme":"corazones"}'::jsonb, false, 9),
  ('Pelón princesa', 'Pañuelo lila de lunares y corona dorada.', 'muñecos', 5.00, '{"theme":"princesa"}'::jsonb, false, 10),
  ('Pelón superhéroe', 'Con antifaz y estrellas: porque los niños pelones son los verdaderos héroes.', 'muñecos', 5.00, '{"theme":"heroe"}'::jsonb, true, 11),
  ('Pelón primavera', 'Verde con lunares y una flor. Alegría para cualquier estantería.', 'muñecos', 5.00, '{"theme":"primavera"}'::jsonb, false, 12),
  ('Pelón marinero', 'Rayas azules y gorra, con olor a Sardinero.', 'muñecos', 5.00, '{"theme":"marinero"}'::jsonb, false, 13),
  ('Pelona con lazo', 'Pañuelo de corazones rematado con un gran lazo.', 'muñecos', 5.00, '{"theme":"lazo"}'::jsonb, false, 14),
  ('Broche pelón', 'Para la ropa, la mochila o el bolso. Llévalo puesto y cuenta la historia.', 'broches', 2.00, '{"theme":"clasico"}'::jsonb, true, 15),
  ('Broche racinguista', 'El broche más verdiblanco para ir a los Campos de Sport.', 'broches', 2.00, '{"theme":"racing"}'::jsonb, false, 16),
  ('Broche navideño', 'Con pompón y estrellas. Se agota cada diciembre.', 'broches', 2.00, '{"theme":"navidad"}'::jsonb, false, 17),
  ('Imán pelón', 'Para la nevera de casa o la pizarra de clase.', 'imanes', 2.00, '{"theme":"cielo"}'::jsonb, false, 18),
  ('Imán de lunares', 'Un toque flamenco para la nevera.', 'imanes', 2.00, '{"theme":"flamenco"}'::jsonb, false, 19),
  ('Llavero pelón', 'Para que te acompañe a todas partes. Ideal como detalle de boda, comunión o cumpleaños.', 'llaveros', 3.00, '{"theme":"sabio"}'::jsonb, false, 20),
  ('Llavero de la Selección', 'Rojo y gualda para tus llaves.', 'llaveros', 3.00, '{"theme":"espana"}'::jsonb, false, 21),
  ('Pulsera pelona', 'Pulsera con un mini pelón de corazones.', 'pulseras', 3.00, '{"theme":"corazones"}'::jsonb, false, 22),
  ('Lápiz pelón', 'Lápiz con un pelón en la punta. El favorito de los coles.', 'lápices', 3.00, '{"theme":"primavera"}'::jsonb, true, 23),
  ('Calendario solidario', 'Calendario anual de la asociación. Todo lo recaudado va a la causa.', 'otros', 6.00, '{"theme":"naranja"}'::jsonb, false, 24),
  ('Detalles para eventos', 'Pelones personalizados para bodas, bautizos, comuniones y empresas. Escríbenos y lo preparamos contigo.', 'encargos', null, '{"theme":"lazo"}'::jsonb, true, 25)
) v where not exists (select 1 from public.products);

insert into public.partners (name, description, grp, url, color, sort)
select * from (values
  ('IDIVAL', 'Instituto de Investigación Marqués de Valdecilla. Proyectos de hematología pediátrica.', 'Destino de la ayuda', 'https://www.idival.org/colaboracion-de-la-asociacion-de-pelones-cantabria-para-la-investigacion-pediatrica-en-valdecilla/', '#1d6fb8', 1),
  ('Aula Hospitalaria Valdecilla', 'Escuela dentro del hospital para los niños ingresados.', 'Destino de la ayuda', null, '#26a9e0', 2),
  ('Fundación Theodora', 'Doctores Sonrisa en los hospitales infantiles.', 'Destino de la ayuda', 'https://www.theodora.org/es/', '#ec4f8e', 3),
  ('Fundación Josep Carreras', 'Contra la leucemia y las enfermedades de la sangre.', 'Destino de la ayuda', 'https://www.fcarreras.org/', '#c7306c', 4),
  ('Real Racing Club', 'Respaldo del club y camiseta firmada por la plantilla.', 'Nos apoyan', 'https://www.realracingclub.es/noticias/el-racing-respalda-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil', '#2bb673', 5),
  ('Ayto. Santa Cruz de Bezana', 'Evento solidario en Soto de la Marina (2023).', 'Nos apoyan', 'https://eldiariocantabria.publico.es/articulo/arco-de-la-bahia/ayuntamiento-organiza-evento-solidario-favor-asociacion-pelones-cantabria/20230807170309140939.html', '#1d6fb8', 6),
  ('Urban Chic Eva Díez', 'Peluquería coorganizadora de la tarde solidaria.', 'Nos apoyan', null, '#ec4f8e', 7),
  ('Peña Bonitos del Norte', 'Marmita solidaria en la Semana Grande de Santander.', 'Nos apoyan', 'https://www.santanderquehacer.com/14-penas-14-causas-fiestas-semana-grande-santander/', '#f7941d', 8),
  ('CEO Príncipe de Asturias', 'Semana y Marcha Solidaria de Ramales de la Victoria.', 'Nos apoyan', 'https://ramalesblog.wordpress.com/2026/01/30/semana-solidaria-7/', '#7c5cc4', 9),
  ('AMPA CEIP Cabo Mayor', 'Venta de calendarios solidarios.', 'Nos apoyan', 'https://comunidadeducativacabomayor.wordpress.com/2017/01/17/pelones-cantabria/', '#26a9e0', 10),
  ('Trail Solidario La Guariza', 'Carrera en Salces (Campoo de Suso) a beneficio de Pelones.', 'Nos apoyan', 'https://www.vivecampoo.es/noticia/trail-solidario-guariza-se-vuelca-ano-pelones-cantabria-14550.html', '#2bb673', 11),
  ('Pelayadas Solidarias', 'Reto de la reconquista contra el cáncer infantil en Mi Grano de Arena.', 'Nos apoyan', 'https://www.migranodearena.org/usuario/pelones-cantabria', '#c7306c', 12),
  ('Everesting Estacas de Trueba', 'Adrián y Daniel, 9.516 m de desnivel por la causa.', 'Nos apoyan', 'https://masters.abloque.com/2017/06/17/everesting-challenge-pelones-cantabria/', '#f7941d', 13),
  ('Residencia Sancibrián', 'Manualidades para el mercadillo solidario de 2023.', 'Nos apoyan', null, '#7c5cc4', 14),
  ('Comercio Astillero-Guarnizo', 'Campaña navideña de broches con photocall y sorteo (2016).', 'Nos apoyan', 'https://www.astillero.es/content/arranca-la-campa%C3%B1a-solidaria-de-la-asociaci%C3%B3n-comercio-astillero-guarnizo-con-pelones', '#ec4f8e', 15)
) v where not exists (select 1 from public.partners);

insert into public.news (title, excerpt, kind, event_date, location, published, link)
select * from (values
  ('El Racing nos abre las puertas de Nando Yosu', 'Jugadores y leyendas del Real Racing Club se fotografían con nuestros voluntarios y nos dan su respaldo.', 'logro', date '2016-05-14', 'Instalaciones Nando Yosu, Santander', true, 'https://www.realracingclub.es/noticias/el-racing-respalda-a-la-asociacion-pelones-cantabria-en-su-lucha-contra-la-enfermedad-infantil'),
  ('Everesting por Pelones en Estacas de Trueba', 'Adrián y Daniel suben 12 veces el puerto: más de 9.500 metros de desnivel en un día para apoyar la causa.', 'logro', date '2017-06-17', 'Estacas de Trueba', true, 'https://masters.abloque.com/2017/06/17/everesting-challenge-pelones-cantabria/'),
  ('Tarde solidaria en Soto de la Marina', 'Juegos, talleres, mercadillo y sorteo a favor de Pelones con el Ayuntamiento de Santa Cruz de Bezana y Urban Chic Eva Díez.', 'evento', date '2023-08-12', 'Plaza Nueva, Soto de la Marina', true, 'https://eldiariocantabria.publico.es/articulo/arco-de-la-bahia/ayuntamiento-organiza-evento-solidario-favor-asociacion-pelones-cantabria/20230807170309140939.html'),
  ('La Marcha Solidaria de Ramales camina por Pelones', 'El CEO Príncipe de Asturias dedica su semana solidaria a la asociación. Lo recaudado irá a un campamento para niños que han pasado un cáncer.', 'logro', date '2026-01-30', 'Ramales de la Victoria', true, 'https://ramalesblog.wordpress.com/2026/01/30/semana-solidaria-7/'),
  ('Semana Grande: marmita solidaria con Bonitos del Norte', 'La peña Bonitos del Norte cocina por Pelones en la Semana Grande de Santander. Las peñas entregaron 27.627 € a distintas causas sociales.', 'logro', date '2026-09-19', 'Santander', true, 'https://www.ifomo.es/articulo/santander/cantabria-penas-entregan-distintas-causas-sociales-mas-27500-euros-recaudados-semana-grande-santander/20260919184847358928.html')
) v where not exists (select 1 from public.news);

-- =====================================================================
--  ÚLTIMO PASO: convierte tu cuenta en administradora (tras registrarte
--  en la web). Cambia el correo y ejecuta solo esta línea:
--
--  update public.profiles set role = 'admin' where email = 'TU_CORREO@ejemplo.com';
-- =====================================================================

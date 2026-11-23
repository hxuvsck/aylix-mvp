-- AYLIX core schema (pilot model, locked 2026-11-21)
-- ₮25,000 per Request · 80/20 · operator accepts within 5 min or it moves on · no accept in 10 min → 100% refund
-- 1 free rematch · service 09:00–23:00 local · 48 h review window and payout hold · refunds 100 / 50 / 0 %
-- Money is stored in minor units (MNT has no minor unit, so ₮25,000 = 25000).

create extension if not exists pgcrypto;

-- ───────────────────────── Enums ─────────────────────────
create type user_role as enum ('traveler', 'operator', 'admin');
create type operator_status as enum ('applied', 'id_check', 'interview', 'practice', 'approved', 'suspended', 'rejected');
create type help_type as enum ('navigation', 'translation', 'local');
create type request_status as enum (
  'awaiting_payment',  -- created, not paid yet
  'searching',         -- paid, being offered to operators
  'matched',           -- an operator accepted; chat open
  'closed_solved',     -- traveler (or operator) closed as solved
  'under_review',      -- marked not solved; waiting for an admin decision
  'closed',            -- reviewed, final
  'refunded',          -- 100% refund (no accept in 10 min, rematch failed, or admin)
  'cancelled'          -- cancelled before payment
);
create type offer_result as enum ('pending', 'accepted', 'declined', 'expired');
create type payment_status as enum ('pending', 'confirmed', 'refunded', 'partially_refunded', 'failed');
create type payout_status as enum ('on_hold', 'ready', 'paid');

-- ───────────────────────── Settings ─────────────────────────
create table app_settings (
  id boolean primary key default true check (id),
  price_mnt int not null default 25000,
  operator_share numeric not null default 0.80,
  accept_window interval not null default '5 minutes',
  search_window interval not null default '10 minutes',
  review_window interval not null default '48 hours',
  open_hour int not null default 9,
  close_hour int not null default 23,
  timezone text not null default 'Asia/Seoul'
);
insert into app_settings default values;

-- ───────────────────────── Website intake (anon, insert-only) ─────────────────────────
create table help_intake (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(name) <= 120),
  contact text not null check (length(contact) <= 160),
  city text not null,
  language text not null,
  help_type help_type not null,
  description text not null check (length(description) between 10 and 2000),
  ui_lang text,
  accepted_terms boolean not null check (accepted_terms),
  handled boolean not null default false
);

create table operator_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (length(full_name) <= 120),
  contact text not null check (length(contact) <= 160),
  email text,
  age int not null check (age between 18 and 99),
  city text not null,
  area text not null,
  years_in_city text not null,
  status text not null,
  languages jsonb not null default '{}',
  skills text[] not null default '{}',
  hours_per_week int not null check (hours_per_week between 1 and 80),
  help_example text not null check (length(help_example) between 20 and 2000),
  licensed_guide boolean not null default false,
  agrees_id_check boolean not null check (agrees_id_check),
  agrees_agreement boolean not null check (agrees_agreement),
  accepted_terms boolean not null check (accepted_terms),
  ui_lang text,
  review_status operator_status not null default 'applied',
  review_note text
);

-- ───────────────────────── People ─────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  role user_role not null default 'traveler',
  full_name text,
  phone text,
  ui_lang text not null default 'mn' check (ui_lang in ('en', 'mn', 'ko')),
  accepted_terms_at timestamptz
);

create table operators (
  id uuid primary key references profiles on delete cascade,
  status operator_status not null default 'applied',
  city text not null default 'Seoul',
  languages text[] not null default '{mn,ko}',
  skills text[] not null default '{}',
  licensed_guide boolean not null default false,
  online boolean not null default false,
  last_offered_at timestamptz,
  bank_name text,
  bank_account_last4 text,
  application_id uuid references operator_applications
);

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_role() returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- New auth user → profile row
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, ui_lang)
  values (new.id, new.phone, coalesce(new.raw_user_meta_data->>'ui_lang', 'mn'))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ───────────────────────── Requests ─────────────────────────
create table requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('AX-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  created_at timestamptz not null default now(),
  traveler_id uuid not null references profiles,
  operator_id uuid references operators,
  status request_status not null default 'awaiting_payment',
  help_type help_type not null,
  description text not null check (length(description) between 10 and 2000),
  language text not null check (language in ('mn', 'ko', 'en')),
  city text not null default 'Seoul',
  district text,
  exact_location_shared boolean not null default false,
  price_mnt int not null,
  searching_since timestamptz,
  matched_at timestamptz,
  closed_at timestamptz,
  rematch_used boolean not null default false,
  traveler_outcome text check (traveler_outcome in ('solved', 'not_solved')),
  not_solved_reason text,
  refund_pct int check (refund_pct in (0, 50, 100)),
  decided_by uuid references profiles,
  decision_note text
);
create index on requests (status);
create index on requests (traveler_id);
create index on requests (operator_id);

create table request_offers (
  id bigint generated always as identity primary key,
  request_id uuid not null references requests on delete cascade,
  operator_id uuid not null references operators,
  offered_at timestamptz not null default now(),
  result offer_result not null default 'pending',
  responded_at timestamptz,
  unique (request_id, operator_id)
);
create index on request_offers (operator_id, result);

create table messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references requests on delete cascade,
  sender_id uuid references profiles,          -- null = system message
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index on messages (request_id, id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references requests on delete cascade,
  provider text not null check (provider in ('qpay', 'stripe', 'bank')),
  amount_mnt int not null,
  status payment_status not null default 'pending',
  provider_ref text,
  confirmed_at timestamptz,
  confirmed_by uuid references profiles,
  refunded_mnt int not null default 0
);

create table ratings (
  request_id uuid primary key references requests on delete cascade,
  stars int not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  review text check (length(review) <= 1000),
  public boolean not null default false,       -- set true after moderation
  created_at timestamptz not null default now()
);

create table payout_items (
  request_id uuid primary key references requests on delete cascade,
  operator_id uuid not null references operators,
  amount_mnt int not null,
  release_at timestamptz not null,
  status payout_status not null default 'on_hold',
  paid_at timestamptz,
  batch_ref text
);

-- ───────────────────────── Helpers ─────────────────────────
create or replace function settings() returns app_settings language sql stable as $$ select * from app_settings limit 1 $$;

create or replace function is_open(at timestamptz default now()) returns boolean language sql stable as $$
  select extract(hour from at at time zone s.timezone) >= s.open_hour
     and extract(hour from at at time zone s.timezone) <  s.close_hour
  from app_settings s
$$;

create or replace function sys_msg(rid uuid, txt text) returns void language sql security definer set search_path = public as $$
  insert into messages (request_id, sender_id, body) values (rid, null, txt);
$$;

-- Offer a searching Request to the next online, approved operator in the same city who speaks the language and
-- hasn't been offered it yet. Least-recently-offered first, so work spreads evenly.
create or replace function route_request(rid uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare r requests; op uuid;
begin
  select * into r from requests where id = rid for update;
  if r.status <> 'searching' then return null; end if;
  if exists (select 1 from request_offers where request_id = rid and result = 'pending') then return null; end if;

  select o.id into op from operators o
  where o.status = 'approved' and o.online and o.city = r.city and r.language = any (o.languages)
    and not exists (select 1 from request_offers x where x.request_id = rid and x.operator_id = o.id)
    and not exists (select 1 from requests busy where busy.operator_id = o.id and busy.status = 'matched')
  order by o.last_offered_at nulls first
  limit 1;

  if op is not null then
    insert into request_offers (request_id, operator_id) values (rid, op);
    update operators set last_offered_at = now() where id = op;
  end if;
  return op;
end $$;

-- ───────────────────────── Traveler actions ─────────────────────────
create or replace function create_request(p_help_type help_type, p_description text, p_language text, p_city text, p_district text)
returns requests language plpgsql security definer set search_path = public as $$
declare r requests;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not is_open() then raise exception 'closed: requests open 09:00–23:00'; end if;
  insert into requests (traveler_id, help_type, description, language, city, district, price_mnt)
  values (auth.uid(), p_help_type, p_description, p_language, coalesce(p_city, 'Seoul'), p_district, (select price_mnt from app_settings))
  returning * into r;
  insert into payments (request_id, provider, amount_mnt) values (r.id, 'qpay', r.price_mnt);
  return r;
end $$;

-- Pilot: the traveler says "I've paid" with a reference; an admin confirms it (manual qPay / bank check).
create or replace function submit_payment(rid uuid, p_provider text, p_ref text) returns void language plpgsql security definer set search_path = public as $$
begin
  update payments p set provider = p_provider, provider_ref = p_ref
  from requests r where p.request_id = r.id and r.id = rid and r.traveler_id = auth.uid() and r.status = 'awaiting_payment';
  if not found then raise exception 'not your request or already paid'; end if;
end $$;

create or replace function request_rematch(rid uuid) returns void language plpgsql security definer set search_path = public as $$
declare r requests;
begin
  select * into r from requests where id = rid and traveler_id = auth.uid() for update;
  if r.status <> 'matched' then raise exception 'not in chat'; end if;
  if r.rematch_used then
    perform refund_full(rid, 'Rematch already used — full refund');
    return;
  end if;
  update requests set status = 'searching', operator_id = null, rematch_used = true, searching_since = now(), matched_at = null where id = rid;
  perform sys_msg(rid, 'Rematch requested. Finding a new operator — they will see this chat.');
  perform route_request(rid);
end $$;

create or replace function close_request(rid uuid, p_outcome text, p_reason text default null) returns void language plpgsql security definer set search_path = public as $$
declare r requests;
begin
  select * into r from requests where id = rid and traveler_id = auth.uid() for update;
  if r.status <> 'matched' then raise exception 'not in chat'; end if;
  if p_outcome = 'solved' then
    update requests set status = 'closed_solved', traveler_outcome = 'solved', closed_at = now() where id = rid;
    insert into payout_items (request_id, operator_id, amount_mnt, release_at)
    values (rid, r.operator_id, round(r.price_mnt * (select operator_share from app_settings)), now() + (select review_window from app_settings));
    perform sys_msg(rid, 'Closed as solved.');
  else
    update requests set status = 'under_review', traveler_outcome = 'not_solved', not_solved_reason = p_reason, closed_at = now() where id = rid;
    perform sys_msg(rid, 'Marked not solved. An Aylix reviewer will decide within 3 business days.');
  end if;
end $$;

create or replace function rate_request(rid uuid, p_stars int, p_tags text[], p_review text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from requests where id = rid and traveler_id = auth.uid() and status in ('closed_solved', 'under_review', 'closed')) then
    raise exception 'cannot rate this request';
  end if;
  insert into ratings (request_id, stars, tags, review) values (rid, p_stars, coalesce(p_tags, '{}'), p_review)
  on conflict (request_id) do update set stars = excluded.stars, tags = excluded.tags, review = excluded.review;
end $$;

-- ───────────────────────── Operator actions ─────────────────────────
create or replace function set_online(p_online boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  update operators set online = p_online where id = auth.uid() and status = 'approved';
  if not found then raise exception 'not an approved operator'; end if;
  if p_online then perform route_request(id) from requests where status = 'searching'; end if;
end $$;

create or replace function respond_offer(rid uuid, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare o request_offers;
begin
  select * into o from request_offers where request_id = rid and operator_id = auth.uid() and result = 'pending' for update;
  if not found then raise exception 'no pending offer'; end if;
  if o.offered_at < now() - (select accept_window from app_settings) then raise exception 'offer expired'; end if;

  update request_offers set result = case when p_accept then 'accepted'::offer_result else 'declined' end, responded_at = now() where id = o.id;
  if p_accept then
    update requests set status = 'matched', operator_id = auth.uid(), matched_at = now() where id = rid and status = 'searching';
    perform sys_msg(rid, 'An operator joined the chat.');
  else
    perform route_request(rid);
  end if;
end $$;

-- ───────────────────────── Timers (run every minute by pg_cron) ─────────────────────────
create or replace function refund_full(rid uuid, why text) returns void language plpgsql security definer set search_path = public as $$
begin
  update requests set status = 'refunded', refund_pct = 100, closed_at = now(), decision_note = why where id = rid;
  update payments set status = 'refunded', refunded_mnt = amount_mnt where request_id = rid;
  update request_offers set result = 'expired' where request_id = rid and result = 'pending';
  perform sys_msg(rid, why);
end $$;

create or replace function tick() returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- 5 min without an answer → expire and offer to the next operator
  update request_offers set result = 'expired', responded_at = now()
  where result = 'pending' and offered_at < now() - (select accept_window from app_settings);

  for r in select id, searching_since from requests where status = 'searching' loop
    if r.searching_since < now() - (select search_window from app_settings) then
      perform refund_full(r.id, 'No operator accepted within 10 minutes — full refund.');
    else
      perform route_request(r.id);
    end if;
  end loop;

  -- 48 h hold over and no dispute → payout ready
  update payout_items pi set status = 'ready'
  from requests q where q.id = pi.request_id and pi.status = 'on_hold' and pi.release_at <= now() and q.status in ('closed_solved', 'closed');
end $$;

-- Enable pg_cron in the dashboard (Database → Extensions), then:
-- select cron.schedule('aylix-tick', '* * * * *', 'select public.tick()');

-- ───────────────────────── Admin actions ─────────────────────────
create or replace function admin_confirm_payment(rid uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update payments set status = 'confirmed', confirmed_at = now(), confirmed_by = auth.uid() where request_id = rid and status = 'pending';
  update requests set status = 'searching', searching_since = now() where id = rid and status = 'awaiting_payment';
  if not found then raise exception 'request is not awaiting payment'; end if;
  perform sys_msg(rid, 'Payment confirmed. Finding your operator…');
  perform route_request(rid);
end $$;

create or replace function admin_decide(rid uuid, p_refund_pct int, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare r requests; kept int;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  select * into r from requests where id = rid and status = 'under_review' for update;
  if not found then raise exception 'not under review'; end if;
  kept := r.price_mnt * (100 - p_refund_pct) / 100;
  update requests set status = 'closed', refund_pct = p_refund_pct, decided_by = auth.uid(), decision_note = p_note where id = rid;
  update payments set refunded_mnt = r.price_mnt - kept,
    status = case p_refund_pct when 100 then 'refunded' when 0 then 'confirmed' else 'partially_refunded' end::payment_status
  where request_id = rid;
  if kept > 0 then
    insert into payout_items (request_id, operator_id, amount_mnt, release_at)
    values (rid, r.operator_id, round(kept * (select operator_share from app_settings)), now());
  end if;
  perform sys_msg(rid, format('Review decided: %s%% refund.', p_refund_pct));
end $$;

create or replace function admin_set_operator(op uuid, p_status operator_status) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  insert into operators (id, status) values (op, p_status) on conflict (id) do update set status = excluded.status;
  update profiles set role = 'operator' where id = op and role = 'traveler';
  if p_status <> 'approved' then update operators set online = false where id = op; end if;
end $$;

-- ───────────────────────── Row-level security ─────────────────────────
alter table app_settings enable row level security;
alter table help_intake enable row level security;
alter table operator_applications enable row level security;
alter table profiles enable row level security;
alter table operators enable row level security;
alter table requests enable row level security;
alter table request_offers enable row level security;
alter table messages enable row level security;
alter table payments enable row level security;
alter table ratings enable row level security;
alter table payout_items enable row level security;

create policy "anyone reads settings" on app_settings for select using (true);

-- Website forms: anyone may insert, only admins read
create policy "public submits help" on help_intake for insert to anon, authenticated with check (true);
create policy "admin reads help" on help_intake for all using (is_admin());
create policy "public applies" on operator_applications for insert to anon, authenticated with check (true);
create policy "admin reads applications" on operator_applications for all using (is_admin());

create policy "own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "edit own profile" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = my_role());
-- A traveler can see the first name of the operator in their chat, and vice versa
create policy "chat partner profile" on profiles for select using (
  exists (select 1 from requests q where q.status <> 'awaiting_payment'
          and ((q.traveler_id = auth.uid() and q.operator_id = profiles.id) or (q.operator_id = auth.uid() and q.traveler_id = profiles.id)))
);

create policy "own operator row" on operators for select using (id = auth.uid() or is_admin());

create or replace function can_see_request(rid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from requests q where q.id = rid and (
      q.traveler_id = auth.uid() or q.operator_id = auth.uid() or is_admin()
      or exists (select 1 from request_offers o where o.request_id = q.id and o.operator_id = auth.uid() and o.result = 'pending')
    ))
$$;

create policy "see own requests" on requests for select using (can_see_request(id));
create policy "admin edits requests" on requests for update using (is_admin());
create policy "see own offers" on request_offers for select using (operator_id = auth.uid() or is_admin());

create policy "read chat" on messages for select using (
  exists (select 1 from requests q where q.id = request_id and (q.traveler_id = auth.uid() or q.operator_id = auth.uid() or is_admin()))
);
create policy "write chat" on messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from requests q where q.id = request_id and q.status = 'matched' and (q.traveler_id = auth.uid() or q.operator_id = auth.uid()))
);

create policy "see own payment" on payments for select using (can_see_request(request_id));
create policy "see rating" on ratings for select using (public or can_see_request(request_id));
create policy "admin moderates" on ratings for update using (is_admin());
create policy "see own payouts" on payout_items for select using (operator_id = auth.uid() or is_admin());
create policy "admin pays" on payout_items for update using (is_admin());

-- Realtime for chat and status changes
alter publication supabase_realtime add table messages, requests, request_offers;

-- Public operator stats shown to travelers (no personal data)
create view operator_public with (security_invoker = false) as
  select o.id, split_part(coalesce(p.full_name, 'Operator'), ' ', 1) as first_name, o.languages, o.licensed_guide,
         round(avg(r.stars)::numeric, 1) as rating, count(r.*) as rating_count
  from operators o join profiles p on p.id = o.id left join requests q on q.operator_id = o.id left join ratings r on r.request_id = q.id
  where o.status = 'approved' group by o.id, p.full_name;
grant select on operator_public to authenticated;

revoke execute on function route_request, tick, refund_full, sys_msg from public, anon, authenticated;

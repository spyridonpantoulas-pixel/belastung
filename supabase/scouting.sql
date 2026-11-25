-- Scouting-Bereich: Berichte nur mit Scouting-PIN lesbar (Prüfung auf dem Server)
-- Gleiches Muster wie der Medizin-Bereich: kein direkter Tabellenzugriff, nur über Funktionen.
create extension if not exists pgcrypto with schema extensions;

create table if not exists scout_config (
  team text primary key,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);
create table if not exists scout_attempts (
  id bigserial primary key,
  team text not null,
  at timestamptz not null default now()
);
create table if not exists scout_items (
  id text primary key,
  team text not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table scout_config enable row level security;
alter table scout_attempts enable row level security;
alter table scout_items enable row level security;
revoke all on scout_config, scout_attempts, scout_items from anon, authenticated;

create or replace function scout_auth(p_team text, p_pin text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare h text; fails int;
begin
  delete from scout_attempts where at < now() - interval '1 day';
  select count(*) into fails from scout_attempts where team = p_team and at > now() - interval '15 minutes';
  if fails >= 5 then return 'locked'; end if;
  select pin_hash into h from scout_config where team = p_team;
  if h is null then return 'nopin'; end if;
  if crypt(coalesce(p_pin, ''), h) = h then return 'ok'; end if;
  insert into scout_attempts(team) values (p_team);
  return 'pin';
end $$;

create or replace function scout_list(p_team text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text;
begin
  a := scout_auth(p_team, p_pin);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  return jsonb_build_object('ok', true, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('id', substr(id, length(p_team) + 2), 'kind', kind, 'data', data,
                                        'updated_at', updated_at, 'updated_by', updated_by))
    from scout_items where team = p_team and not deleted), '[]'::jsonb));
end $$;

create or replace function scout_put(p_team text, p_pin text, p_items jsonb, p_by text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text; x jsonb;
begin
  a := scout_auth(p_team, p_pin);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then
    return jsonb_build_object('ok', false, 'error', 'format');
  end if;
  for x in select value from jsonb_array_elements(p_items) loop
    if coalesce(x->>'kind', '') not in ('player', 'report') or length(coalesce(x->'data', '{}'::jsonb)::text) > 20000 then
      return jsonb_build_object('ok', false, 'error', 'format');
    end if;
    insert into scout_items(id, team, kind, data, deleted, updated_at, updated_by)
    values (p_team || '|' || (x->>'id'), p_team, x->>'kind', coalesce(x->'data', '{}'::jsonb),
            coalesce((x->>'deleted')::boolean, false), now(), left(p_by, 60))
    on conflict (id) do update set kind = excluded.kind, data = excluded.data, deleted = excluded.deleted,
                                   updated_at = now(), updated_by = excluded.updated_by;
  end loop;
  return jsonb_build_object('ok', true);
end $$;

-- PIN festlegen oder ändern. Gibt es noch keine PIN, legt der erste Aufruf sie fest
-- (das macht das Trainerteam direkt nach dem Einspielen). Danach nur mit der bisherigen PIN.
create or replace function scout_set_pin(p_team text, p_old text, p_new text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text;
begin
  if p_new !~ '^[0-9]{6}$' then return jsonb_build_object('ok', false, 'error', 'format'); end if;
  if not exists (select 1 from scout_config where team = p_team) then
    insert into scout_config(team, pin_hash) values (p_team, crypt(p_new, gen_salt('bf')));
    return jsonb_build_object('ok', true, 'created', true);
  end if;
  a := scout_auth(p_team, p_old);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  update scout_config set pin_hash = crypt(p_new, gen_salt('bf')), updated_at = now() where team = p_team;
  return jsonb_build_object('ok', true);
end $$;

-- Ob schon eine PIN festgelegt ist (verrät nichts außer ja/nein)
create or replace function scout_has_pin(p_team text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from scout_config where team = p_team);
$$;

revoke all on function scout_auth(text, text) from public, anon, authenticated;
revoke all on function scout_list(text, text) from public;
revoke all on function scout_put(text, text, jsonb, text) from public;
revoke all on function scout_set_pin(text, text, text) from public;
revoke all on function scout_has_pin(text) from public;
grant execute on function scout_list(text, text) to anon, authenticated;
grant execute on function scout_put(text, text, jsonb, text) to anon, authenticated;
grant execute on function scout_set_pin(text, text, text) to anon, authenticated;
grant execute on function scout_has_pin(text) to anon, authenticated;

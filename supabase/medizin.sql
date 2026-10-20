-- Medizin-Bereich: Akten nur mit Medizin-PIN lesbar (Prüfung auf dem Server)
create extension if not exists pgcrypto with schema extensions;

create table if not exists med_config (
  team text primary key,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);
create table if not exists med_attempts (
  id bigserial primary key,
  team text not null,
  at timestamptz not null default now()
);
create table if not exists med_items (
  id text primary key,
  team text not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text
);
-- Kein direkter Zugriff über den App-Schlüssel – nur über die Funktionen unten
alter table med_config enable row level security;
alter table med_attempts enable row level security;
alter table med_items enable row level security;
revoke all on med_config, med_attempts, med_items from anon, authenticated;

create or replace function med_auth(p_team text, p_pin text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare h text; fails int;
begin
  delete from med_attempts where at < now() - interval '1 day';
  select count(*) into fails from med_attempts where team = p_team and at > now() - interval '15 minutes';
  if fails >= 5 then return 'locked'; end if;
  select pin_hash into h from med_config where team = p_team;
  if h is null then return 'nopin'; end if;
  if crypt(coalesce(p_pin, ''), h) = h then return 'ok'; end if;
  insert into med_attempts(team) values (p_team);
  return 'pin';
end $$;

create or replace function med_list(p_team text, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text;
begin
  a := med_auth(p_team, p_pin);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  return jsonb_build_object('ok', true, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('id', substr(id, length(p_team) + 2), 'kind', kind, 'data', data,
                                        'updated_at', updated_at, 'updated_by', updated_by))
    from med_items where team = p_team and not deleted), '[]'::jsonb));
end $$;

create or replace function med_put(p_team text, p_pin text, p_items jsonb, p_by text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text; x jsonb;
begin
  a := med_auth(p_team, p_pin);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 200 then
    return jsonb_build_object('ok', false, 'error', 'format');
  end if;
  for x in select value from jsonb_array_elements(p_items) loop
    insert into med_items(id, team, kind, data, deleted, updated_at, updated_by)
    values (p_team || '|' || (x->>'id'), p_team, x->>'kind', coalesce(x->'data', '{}'::jsonb),
            coalesce((x->>'deleted')::boolean, false), now(), p_by)
    on conflict (id) do update set kind = excluded.kind, data = excluded.data, deleted = excluded.deleted,
                                   updated_at = now(), updated_by = excluded.updated_by;
  end loop;
  return jsonb_build_object('ok', true);
end $$;

create or replace function med_set_pin(p_team text, p_old text, p_new text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare a text;
begin
  a := med_auth(p_team, p_old);
  if a <> 'ok' then return jsonb_build_object('ok', false, 'error', a); end if;
  if p_new !~ '^[0-9]{6,12}$' then return jsonb_build_object('ok', false, 'error', 'format'); end if;
  update med_config set pin_hash = crypt(p_new, gen_salt('bf')), updated_at = now() where team = p_team;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function med_auth(text, text) from public, anon, authenticated;
revoke all on function med_list(text, text) from public;
revoke all on function med_put(text, text, jsonb, text) from public;
revoke all on function med_set_pin(text, text, text) from public;
grant execute on function med_list(text, text) to anon, authenticated;
grant execute on function med_put(text, text, jsonb, text) to anon, authenticated;
grant execute on function med_set_pin(text, text, text) to anon, authenticated;

-- Medizin-PIN festlegen (mind. 6 Ziffern, DEINE-PIN ersetzen):
insert into med_config(team, pin_hash) values ('fcs-liga', extensions.crypt('DEINE-PIN', extensions.gen_salt('bf')))
  on conflict (team) do update set pin_hash = excluded.pin_hash, updated_at = now();

-- Phase 2: the first schema.
--
-- Clerk owns organizations, so this database keeps a small mirror of the
-- organization ids it has seen. Every application row points at one of those
-- ids, and deleting the organization removes the row. RLS reads the active
-- organization from the Clerk token, not from a query the application writes.

create extension if not exists pgcrypto;

create table public.organizations (
  id text primary key,
  name text not null,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  name text not null,
  repo_url text not null,
  repo_owner text,
  repo_name text,
  default_branch text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, repo_url),
  unique (id, organization_id)
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  stage text,
  stage_message text,
  error_stage text,
  error_message text,
  commit_sha text,
  coverage jsonb,
  created_by text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade,
  unique (id, organization_id)
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  path text not null,
  directory text not null,
  extension text,
  language text,
  line_count integer not null default 0 check (line_count >= 0),
  content_hash text,
  is_parsed boolean not null default true,
  skip_reason text,
  fan_in integer not null default 0 check (fan_in >= 0),
  fan_out integer not null default 0 check (fan_out >= 0),
  created_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade,
  unique (analysis_id, path),
  unique (id, organization_id)
);

create table public.edges (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  from_file_id uuid not null,
  to_file_id uuid not null,
  kind text not null check (kind in ('import', 'reexport', 'dynamic', 'require')),
  specifier text not null default '',
  is_type_only boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade,
  foreign key (from_file_id, organization_id)
    references public.files (id, organization_id) on delete cascade,
  foreign key (to_file_id, organization_id)
    references public.files (id, organization_id) on delete cascade,
  unique (analysis_id, from_file_id, to_file_id, kind, specifier)
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  file_id uuid not null,
  method text not null,
  path text not null,
  framework text,
  created_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade,
  foreign key (file_id, organization_id)
    references public.files (id, organization_id) on delete cascade,
  unique (analysis_id, method, path)
);

create table public.explanations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  file_id uuid,
  target_kind text not null check (target_kind in ('file', 'folder')),
  target_path text not null,
  content text not null,
  content_hash text,
  model text,
  prompt_version text,
  cache_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade,
  foreign key (file_id, organization_id)
    references public.files (id, organization_id) on delete cascade,
  unique (analysis_id, cache_key),
  check (
    (target_kind = 'file' and file_id is not null)
    or (target_kind = 'folder' and file_id is null)
  )
);

create table public.file_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  file_id uuid not null,
  role text not null,
  source text not null check (source in ('convention', 'model')),
  created_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade,
  foreign key (file_id, organization_id)
    references public.files (id, organization_id) on delete cascade,
  unique (analysis_id, file_id)
);

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations (id) on delete cascade,
  analysis_id uuid not null,
  kind text not null
    check (kind in ('cycle', 'unimported', 'high_fan_in', 'oversized')),
  title text not null,
  detail text,
  file_ids uuid[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (analysis_id, organization_id)
    references public.analyses (id, organization_id) on delete cascade
);

create index analyses_organization_created_idx
  on public.analyses (organization_id, created_at desc);
create index analyses_project_idx on public.analyses (project_id);
create index files_analysis_idx on public.files (analysis_id);
create index edges_analysis_idx on public.edges (analysis_id);
create index routes_analysis_idx on public.routes (analysis_id);
create index explanations_analysis_idx on public.explanations (analysis_id);
create index file_roles_analysis_idx on public.file_roles (analysis_id);
create index insights_analysis_idx on public.insights (analysis_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger analyses_set_updated_at
  before update on public.analyses
  for each row execute function public.set_updated_at();
create trigger explanations_set_updated_at
  before update on public.explanations
  for each row execute function public.set_updated_at();

-- Clerk session tokens carry the active organization as either the v2 `o.id`
-- object or the older `org_id` claim. One helper keeps every policy reading the
-- same value.
create or replace function public.current_organization_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(auth.jwt() -> 'o' ->> 'id', ''),
    nullif(auth.jwt() ->> 'org_id', '')
  );
$$;

alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.files enable row level security;
alter table public.edges enable row level security;
alter table public.routes enable row level security;
alter table public.explanations enable row level security;
alter table public.file_roles enable row level security;
alter table public.insights enable row level security;

create policy "organization members access their organization"
  on public.organizations for all to authenticated
  using (id = public.current_organization_id())
  with check (id = public.current_organization_id());

create policy "organization members access projects"
  on public.projects for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access analyses"
  on public.analyses for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access files"
  on public.files for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access edges"
  on public.edges for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access routes"
  on public.routes for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access explanations"
  on public.explanations for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access file roles"
  on public.file_roles for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "organization members access insights"
  on public.insights for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.organizations,
  public.projects,
  public.analyses,
  public.files,
  public.edges,
  public.routes,
  public.explanations,
  public.file_roles,
  public.insights
to authenticated;
grant execute on function public.current_organization_id() to authenticated;

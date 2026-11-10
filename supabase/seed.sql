-- Phase 2 seed data. Nothing in the application creates a real analysis yet,
-- so these rows make the dashboard demonstrable. The second organization is a
-- Clerk test team; both organizations are switched to from the app header.

insert into public.organizations (id, name, slug)
values
  (
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'DEVASHISH''s Organization',
    'devashish-s-organization-1794237965979970562'
  ),
  (
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'Cartograph Demo',
    'cartograph-demo-1794239632828516375'
  )
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug;

insert into public.projects (
  id, organization_id, name, repo_url, repo_owner, repo_name, default_branch
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'hono',
    'https://github.com/honojs/hono',
    'honojs',
    'hono',
    'main'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'zod',
    'https://github.com/colinhacks/zod',
    'colinhacks',
    'zod',
    'main'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'drizzle-orm',
    'https://github.com/drizzle-team/drizzle-orm',
    'drizzle-team',
    'drizzle-orm',
    'main'
  ),
  (
    'b1000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'trpc',
    'https://github.com/trpc/trpc',
    'trpc',
    'trpc',
    'main'
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'query',
    'https://github.com/TanStack/query',
    'TanStack',
    'query',
    'main'
  )
on conflict (id) do update
set name = excluded.name,
    repo_url = excluded.repo_url,
    repo_owner = excluded.repo_owner,
    repo_name = excluded.repo_name,
    default_branch = excluded.default_branch;

insert into public.analyses (
  id, organization_id, project_id, status, stage, stage_message, error_stage,
  error_message, commit_sha, coverage, started_at, finished_at, created_at
)
values
  (
    'a2000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a1000000-0000-4000-8000-000000000001',
    'complete',
    'store',
    'Analysis complete',
    null,
    null,
    '7f6c2b9a1d4e8f0c3a5b7d9e1f2a4c6b8d0e3f5a',
    '{"filesFound": 412, "filesParsed": 409, "filesSkipped": 3, "importsSeen": 980, "importsResolved": 954}',
    now() - interval '18 minutes',
    now() - interval '17 minutes',
    now() - interval '18 minutes'
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a1000000-0000-4000-8000-000000000002',
    'failed',
    'parse',
    'Parsing source files',
    'parse',
    '12 files could not be parsed: unsupported syntax in src/v4/core/parse.ts',
    'c4a9e1b7d2f6058a3c7e9b1d4f6a8c0e2b5d7f9a',
    null,
    now() - interval '2 hours',
    now() - interval '119 minutes',
    now() - interval '2 hours'
  ),
  (
    'a2000000-0000-4000-8000-000000000003',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a1000000-0000-4000-8000-000000000003',
    'running',
    'parse',
    'Resolving imports',
    null,
    null,
    '1b8d4f6a0c2e5b7d9f1a3c6e8b0d2f4a6c9e1b3d',
    null,
    now() - interval '3 minutes',
    null,
    now() - interval '3 minutes'
  ),
  (
    'b2000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b1000000-0000-4000-8000-000000000001',
    'complete',
    'store',
    'Analysis complete',
    null,
    null,
    '9e2f4a6c8b0d3f5a7c9e1b4d6f8a0c2e5b7d9f1a',
    '{"filesFound": 688, "filesParsed": 683, "filesSkipped": 5, "importsSeen": 2140, "importsResolved": 2077}',
    now() - interval '1 day',
    now() - interval '23 hours',
    now() - interval '1 day'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b1000000-0000-4000-8000-000000000002',
    'running',
    'select',
    'Selecting source files',
    null,
    null,
    '3d5f7a9c1e4b6d8f0a2c5e7b9d1f3a6c8e0b2d4f',
    null,
    now() - interval '40 seconds',
    null,
    now() - interval '40 seconds'
  )
on conflict (id) do update
set status = excluded.status,
    stage = excluded.stage,
    stage_message = excluded.stage_message,
    error_stage = excluded.error_stage,
    error_message = excluded.error_message,
    commit_sha = excluded.commit_sha,
    coverage = excluded.coverage,
    started_at = excluded.started_at,
    finished_at = excluded.finished_at;

insert into public.files (
  id, organization_id, analysis_id, path, directory, extension, language,
  line_count, content_hash, is_parsed, skip_reason, fan_in, fan_out
)
values
  (
    'a3000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'src/index.ts', 'src', '.ts', 'typescript', 42,
    'b1d3f5a7c9e1b4d6f8a0c2e5b7d9f1a3', true, null, 0, 1
  ),
  (
    'a3000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'src/app.ts', 'src', '.ts', 'typescript', 186,
    'c3e5b7d9f1a4c6e8b0d2f5a7c9e1b3d6', true, null, 1, 1
  ),
  (
    'a3000000-0000-4000-8000-000000000003',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'src/router.ts', 'src', '.ts', 'typescript', 94,
    'd5f7a9c1e3b6d8f0a2c4e7b9d1f3a5c8', true, null, 1, 1
  ),
  (
    'b3000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'packages/server/src/index.ts', 'packages/server/src', '.ts', 'typescript', 68,
    'e7a9c1b3d5f8a0c2e4b6d9f1a3c5e7b0', true, null, 0, 1
  ),
  (
    'b3000000-0000-4000-8000-000000000002',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'packages/server/src/router.ts', 'packages/server/src', '.ts', 'typescript', 214,
    'f9c1b3d5a7e0c2f4b6d8a1f3c5e7b9d2', true, null, 1, 1
  ),
  (
    'b3000000-0000-4000-8000-000000000003',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'packages/server/src/context.ts', 'packages/server/src', '.ts', 'typescript', 51,
    'a1d3f5b7c9e2a4d6f8b0c3e5a7d9f1b4', true, null, 1, 0
  )
on conflict (id) do update
set path = excluded.path,
    directory = excluded.directory,
    line_count = excluded.line_count,
    fan_in = excluded.fan_in,
    fan_out = excluded.fan_out;

insert into public.edges (
  id, organization_id, analysis_id, from_file_id, to_file_id, kind, specifier
)
values
  (
    'a4000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000002',
    'a3000000-0000-4000-8000-000000000001',
    'import', './index'
  ),
  (
    'a4000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000003',
    'a3000000-0000-4000-8000-000000000002',
    'import', './app'
  ),
  (
    'a4000000-0000-4000-8000-000000000003',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000003',
    'import', './router'
  ),
  (
    'b4000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000002',
    'import', './router'
  ),
  (
    'b4000000-0000-4000-8000-000000000002',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000002',
    'b3000000-0000-4000-8000-000000000003',
    'import', './context'
  )
on conflict (id) do update
set kind = excluded.kind,
    specifier = excluded.specifier;

insert into public.routes (
  id, organization_id, analysis_id, file_id, method, path, framework
)
values
  (
    'a5000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'GET', '/', 'hono'
  ),
  (
    'b5000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000002',
    'POST', '/rpc', 'trpc'
  )
on conflict (id) do update
set method = excluded.method,
    path = excluded.path,
    framework = excluded.framework;

insert into public.explanations (
  id, organization_id, analysis_id, file_id, target_kind, target_path, content,
  content_hash, model, prompt_version, cache_key
)
values
  (
    'a6000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'file', 'src/index.ts',
    $ex$This is the Hono application entry point. It imports the app from `src/app.ts` and the router from `src/router.ts`, then hands the router to the app before exporting the result.$ex$,
    'b1d3f5a7c9e1b4d6f8a0c2e5b7d9f1a3',
    'gpt-5-mini', 'v1', 'a1-index-v1'
  ),
  (
    'b6000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'file', 'packages/server/src/index.ts',
    $ex$This file creates the tRPC server and mounts the router from `packages/server/src/router.ts`. The context helper in `packages/server/src/context.ts` is reached through that router.$ex$,
    'e7a9c1b3d5f8a0c2e4b6d9f1a3c5e7b0',
    'gpt-5-mini', 'v1', 'b1-index-v1'
  )
on conflict (id) do update
set content = excluded.content,
    content_hash = excluded.content_hash;

insert into public.file_roles (
  id, organization_id, analysis_id, file_id, role, source
)
values
  (
    'a7000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'entry', 'convention'
  ),
  (
    'a7000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000002',
    'module', 'convention'
  ),
  (
    'a7000000-0000-4000-8000-000000000003',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000003',
    'router', 'convention'
  ),
  (
    'b7000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'entry', 'convention'
  ),
  (
    'b7000000-0000-4000-8000-000000000002',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000002',
    'router', 'convention'
  ),
  (
    'b7000000-0000-4000-8000-000000000003',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000003',
    'util', 'model'
  )
on conflict (id) do update
set role = excluded.role,
    source = excluded.source;

insert into public.insights (
  id, organization_id, analysis_id, kind, title, detail, file_ids, sort_order
)
values
  (
    'a8000000-0000-4000-8000-000000000001',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'cycle',
    'Import cycle',
    'src/index.ts → src/router.ts → src/app.ts → src/index.ts',
    array[
      'a3000000-0000-4000-8000-000000000001',
      'a3000000-0000-4000-8000-000000000003',
      'a3000000-0000-4000-8000-000000000002'
    ]::uuid[],
    10
  ),
  (
    'a8000000-0000-4000-8000-000000000002',
    'org_3LsLjhcJPo8zRrzRDO66MoZY4od',
    'a2000000-0000-4000-8000-000000000001',
    'unimported',
    'Files nothing imports',
    'src/index.ts is reached by the framework rather than by an import.',
    array['a3000000-0000-4000-8000-000000000001']::uuid[],
    0
  ),
  (
    'b8000000-0000-4000-8000-000000000001',
    'org_3LsP7D5N63LPd0FpvM3NgNenbDp',
    'b2000000-0000-4000-8000-000000000001',
    'high_fan_in',
    'Most depended-on file',
    'packages/server/src/router.ts is imported by 1 file.',
    array['b3000000-0000-4000-8000-000000000002']::uuid[],
    20
  )
on conflict (id) do update
set title = excluded.title,
    detail = excluded.detail,
    file_ids = excluded.file_ids,
    sort_order = excluded.sort_order;

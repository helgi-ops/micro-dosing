-- Team-level plan inputs for Week Builder
create table if not exists public.team_week_inputs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  week_label text,
  weekly_load text not null default 'Moderate',
  last_game_exposure text not null default 'Low/None',
  updated_at timestamptz not null default now(),
  unique (team_id)
);

alter table public.team_week_inputs enable row level security;

-- Only allow team members (coach/admin) to read/write their team inputs
create policy if not exists "team_week_inputs_select" on public.team_week_inputs
  for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_week_inputs.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy if not exists "team_week_inputs_upsert" on public.team_week_inputs
  for insert
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_week_inputs.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy if not exists "team_week_inputs_update" on public.team_week_inputs
  for update
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_week_inputs.team_id
        and tm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_week_inputs.team_id
        and tm.user_id = auth.uid()
    )
  );

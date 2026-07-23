-- Visit ratings: patient/caregiver feedback after scan completion.
-- Feeds the Facility Satisfaction retention metric in dispatcher reports.

create table if not exists visit_ratings (
  id            uuid primary key default gen_random_uuid(),
  order_id      text not null references orders(id) on delete cascade,
  facility_name text not null,
  rating        smallint not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now()
);

create index if not exists visit_ratings_order_idx on visit_ratings(order_id);

alter table visit_ratings enable row level security;

-- App runs as anon (see 009): patients submit, dispatch reads.
create policy "anon can read ratings"   on visit_ratings for select using (true);
create policy "anon can insert ratings" on visit_ratings for insert with check (true);

alter publication supabase_realtime add table visit_ratings;

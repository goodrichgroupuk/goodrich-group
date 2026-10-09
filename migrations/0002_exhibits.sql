create table if not exists exhibits (
  id text primary key,
  title text not null,
  category text not null,
  result text not null,
  image_data text not null,
  removal_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists exhibits_created_idx on exhibits (created_at desc);

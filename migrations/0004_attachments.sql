create table if not exists attachments (
  id text primary key,
  exhibit_id text not null references exhibits (id) on delete cascade,
  kind text not null,
  image_data text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists attachments_exhibit_idx on attachments (exhibit_id, created_at);

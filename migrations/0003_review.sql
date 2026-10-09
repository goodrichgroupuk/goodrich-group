alter table exhibits add column if not exists status text not null default 'pending';

update exhibits set status = 'approved' where status = 'pending';

create index if not exists exhibits_status_idx on exhibits (status, created_at desc);

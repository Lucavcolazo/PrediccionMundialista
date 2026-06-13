-- ============================================================================
-- Scheduled refresh of the Highlightly cache.
--
-- This is the ONLY thing that calls the external Highlightly API. It runs on a
-- fixed schedule and updates public.api_cache. The frontend reads api_cache
-- directly, so every user visit is instant, costs zero API quota, and shows
-- the snapshot from the most recent refresh.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-running this migration must not create duplicate jobs.
do $$
begin
  perform cron.unschedule('refresh-matches');
exception when others then null;
end $$;

do $$
begin
  perform cron.unschedule('refresh-standings');
exception when others then null;
end $$;

-- Matches: every 10 minutes.
select cron.schedule(
  'refresh-matches',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://ekigiiskywebeobjiqhd.supabase.co/functions/v1/highlightly-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"endpoint": "matches"}'::jsonb
  );
  $$
);

-- Standings: every 30 minutes (they only change after matches finish).
select cron.schedule(
  'refresh-standings',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://ekigiiskywebeobjiqhd.supabase.co/functions/v1/highlightly-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"endpoint": "standings"}'::jsonb
  );
  $$
);

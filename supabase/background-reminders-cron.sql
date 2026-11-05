-- Run after creating the Vault secrets `agualin_push_cron_url` (the deployed
-- HTTPS URL to /api/push-reminders) and `agualin_push_cron_secret` (same value
-- as Vercel's CRON_SECRET). Requires Supabase pg_cron and pg_net extensions.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'agualin-background-water-reminders',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'agualin_push_cron_url'),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'agualin_push_cron_secret'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Run the Request timers every minute: 5-min offer expiry, 10-min auto-refund, 48 h payout release.
create extension if not exists pg_cron;
select cron.schedule('aylix-tick', '* * * * *', 'select public.tick()');

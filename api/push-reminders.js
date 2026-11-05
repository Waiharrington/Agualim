import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:soporte@agualin.app';

function isWithinHours(reminder, now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: reminder.time_zone || 'America/Caracas', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const current = `${parts.find((part) => part.type === 'hour')?.value}:${parts.find((part) => part.type === 'minute')?.value}`;
  return reminder.start_time <= reminder.end_time
    ? current >= reminder.start_time.slice(0, 5) && current <= reminder.end_time.slice(0, 5)
    : current >= reminder.start_time.slice(0, 5) || current <= reminder.end_time.slice(0, 5);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!supabaseUrl || !serviceKey || !publicKey || !privateKey) {
    return res.status(503).json({ error: 'Background reminders are not configured.' });
  }

  webpush.setVapidDetails(vapidSubject, publicKey, privateKey);
  const db = createClient(supabaseUrl, serviceKey, { db: { schema: 'agualim' }, auth: { persistSession: false } });
  const { data: reminders, error } = await db.from('push_reminders').select('*').eq('enabled', true);
  if (error) return res.status(500).json({ error: 'Could not read reminders.' });

  const now = new Date();
  let sent = 0;
  for (const reminder of reminders || []) {
    if (reminder.snoozed_until && new Date(reminder.snoozed_until) > now) continue;
    if (!isWithinHours(reminder, now)) continue;

    const { data: latestLog } = await db.from('water_logs').select('created_at')
      .eq('user_id', reminder.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const lastDrink = latestLog?.created_at && new Date(latestLog.created_at) > new Date(reminder.last_drink_at)
      ? latestLog.created_at : reminder.last_drink_at;

    if (!reminder.pending_since && now - new Date(lastDrink) >= reminder.interval_minutes * 60_000) {
      await db.from('push_reminders').update({ pending_since: now.toISOString(), last_sent_at: null }).eq('user_id', reminder.user_id);
      reminder.pending_since = now.toISOString();
      reminder.last_sent_at = null;
    } else if (latestLog?.created_at && reminder.pending_since && new Date(latestLog.created_at) > new Date(reminder.pending_since)) {
      await db.from('push_reminders').update({ last_drink_at: latestLog.created_at, pending_since: null, last_sent_at: null }).eq('user_id', reminder.user_id);
      continue;
    }

    if (!reminder.pending_since || (reminder.last_sent_at && now - new Date(reminder.last_sent_at) < 120_000)) continue;
    const body = reminder.last_sent_at
      ? 'Wai sigue aquí contigo. Toma agua si te apetece y registra tu sorbito 💧'
      : 'Ya pasó el tiempo que elegiste. ¿Tomamos un sorbito? 💧';
    try {
      await webpush.sendNotification({ endpoint: reminder.endpoint, keys: { p256dh: reminder.p256dh, auth: reminder.auth } }, JSON.stringify({
        title: 'Wai te recuerda', body, url: '/',
      }));
      await db.from('push_reminders').update({ last_sent_at: now.toISOString() }).eq('user_id', reminder.user_id);
      sent += 1;
    } catch (pushError) {
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        await db.from('push_reminders').delete().eq('user_id', reminder.user_id);
      } else {
        console.error('Push delivery failed:', pushError.statusCode || pushError.message);
      }
    }
  }
  return res.status(200).json({ sent });
}

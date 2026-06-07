import { supabaseAdmin } from '../db.js';
import { renderAndScreenshot } from './screenshot.js';
import { sendImageStatus } from './whatsapp.js';

/**
 * Check and execute due auto-publish jobs.
 * Called by a cron/scheduler every 15-30 minutes.
 */
export async function processAutoPublishQueue() {
  const now = new Date().toISOString();

  const { data: jobs, error } = await supabaseAdmin
    .from('auto_publish_jobs')
    .select('*, profiles(telegram_id, whatsapp_phone)')
    .eq('active', true)
    .lte('next_run_at', now);

  if (error) {
    console.error('[AutoPublish] Query error:', error.message);
    return;
  }

  if (!jobs || jobs.length === 0) return;

  for (const job of jobs) {
    try {
      // Pick a random ready content in the user's preferred categories
      let contentQuery = supabaseAdmin
        .from('contents')
        .select('*')
        .eq('status', 'ready');

      if (job.categories && job.categories.length > 0) {
        contentQuery = contentQuery.in('nigerian_category', job.categories);
      }
      if (job.vibe) {
        contentQuery = contentQuery.eq('vibe', job.vibe);
      }

      const { data: contents } = await contentQuery.limit(1);

      if (!contents || contents.length === 0) {
        console.log(`[AutoPublish] No content for job ${job.id}`);
        continue;
      }

      const content = contents[0]!;

      // Render screenshot if not already done
      let screenshotUrl = content.screenshot_url;
      if (!screenshotUrl) {
        const buffer = await renderAndScreenshot(content.html_template, content.aspect_ratio);
        const fileName = `auto-publish/${job.id}-${Date.now()}.jpg`;
        await supabaseAdmin.storage
          .from('content-screenshots')
          .upload(fileName, buffer, { contentType: 'image/jpeg' });

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('content-screenshots')
          .getPublicUrl(fileName);
        screenshotUrl = publicUrl;
      }

      // Post to selected platforms
      const profile = job.profiles as unknown as { telegram_id?: string; whatsapp_phone?: string };

      if (job.platforms.includes('whatsapp') && profile?.whatsapp_phone) {
        try {
          await sendImageStatus(profile.whatsapp_phone, screenshotUrl!, content.caption || '');
          await logAnalytics(content.id, job.user_id, 'whatsapp', 'posted');
        } catch (err) {
          console.error(`[AutoPublish] WhatsApp post failed for job ${job.id}:`, err);
        }
      }

      if (job.platforms.includes('telegram') && profile?.telegram_id) {
        // Telegram posting uses bot API — handled by bot service
        // For now, log the intent
        console.log(`[AutoPublish] Would post to Telegram user ${profile.telegram_id}`);
        await logAnalytics(content.id, job.user_id, 'telegram', 'posted');
      }

      // Update the content status
      await supabaseAdmin
        .from('contents')
        .update({ status: 'posted', posted_at: new Date().toISOString() })
        .eq('id', content.id);

      // Calculate next run
      const nextRun = calcNextRun(job.frequency, job.time_of_day);
      await supabaseAdmin
        .from('auto_publish_jobs')
        .update({
          last_run_at: now,
          next_run_at: nextRun,
        })
        .eq('id', job.id);

      console.log(`[AutoPublish] Job ${job.id} executed successfully`);
    } catch (err) {
      console.error(`[AutoPublish] Job ${job.id} failed:`, err);
    }
  }
}

function calcNextRun(frequency: string, timeOfDay?: string): string {
  const now = new Date();
  switch (frequency) {
    case 'every_6h':
      return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
    case 'every_12h':
      return new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
    case 'daily': {
      if (timeOfDay) {
        const [h, m] = timeOfDay.split(':').map(Number);
        const next = new Date(now);
        next.setHours(h || 9, m || 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next.toISOString();
      }
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
}

async function logAnalytics(contentId: string, userId: string, platform: string, event: string) {
  await supabaseAdmin.from('analytics_events').insert({
    content_id: contentId,
    user_id: userId,
    platform,
    event,
  });
}

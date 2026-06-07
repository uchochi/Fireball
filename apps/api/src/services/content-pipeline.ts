import { supabaseAdmin } from '../db.js';
import { generateContent, generateCustomContent } from './ai.js';
import { renderAndScreenshot } from './screenshot.js';

const CATEGORIES = [
  'politics', 'humour', 'jokes', 'hustle_motivation',
  'relationship', 'quotes', 'national_commentary', 'general',
] as const;

const VIBES = ['pidgin', 'english'] as const;
const ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9'] as const;

/**
 * Generate a batch of content (called by daily cron)
 * Creates ~500 items by cycling through categories, vibes, and aspect ratios.
 */
export async function runDailyBatch(targetCount = 500) {
  const perCombo = Math.ceil(targetCount / (CATEGORIES.length * VIBES.length * ASPECT_RATIOS.length));
  let total = 0;

  for (const category of CATEGORIES) {
    for (const vibe of VIBES) {
      for (const aspect of ASPECT_RATIOS) {
        if (total >= targetCount) break;

        for (let i = 0; i < perCombo && total < targetCount; i++) {
          try {
            const content = await generateContent(category, vibe, aspect);
            const screenshotBuffer = await renderAndScreenshot(content.html, aspect);

            // Upload screenshot to Supabase Storage
            const fileName = `screenshots/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
            const { error: uploadError } = await supabaseAdmin.storage
              .from('content-screenshots')
              .upload(fileName, screenshotBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
              });

            if (uploadError) {
              console.error(`Failed to upload screenshot: ${uploadError.message}`);
              continue;
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('content-screenshots')
              .getPublicUrl(fileName);

            // Insert content record
            const { error: insertError } = await supabaseAdmin.from('contents').insert({
              type: 'generated',
              status: 'ready',
              nigerian_category: category,
              vibe,
              aspect_ratio: aspect,
              title: content.title,
              caption: content.caption,
              html_template: content.html,
              screenshot_url: publicUrl,
            });

            if (insertError) {
              console.error(`Failed to insert content: ${insertError.message}`);
              continue;
            }

            total++;
            console.log(`[Batch] Generated ${total}/${targetCount}: ${category} ${vibe} ${aspect}`);
          } catch (err) {
            console.error(`[Batch] Failed generation for ${category}/${vibe}/${aspect}:`, err);
          }
        }
      }
    }
  }

  console.log(`[Batch] Complete. Generated ${total} items.`);
  return total;
}

/**
 * Process a single custom generation job from a user.
 */
export async function processGenerationJob(jobId: string) {
  const { data: job, error: jobError } = await supabaseAdmin
    .from('content_generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    throw new Error(`Job ${jobId} not found`);
  }

  await supabaseAdmin
    .from('content_generation_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId);

  try {
    const content = await generateCustomContent(
      job.prompt,
      job.vibe as 'pidgin' | 'english',
      job.aspect_ratio,
      job.image_urls || [],
    );

    const screenshotBuffer = await renderAndScreenshot(content.html, job.aspect_ratio);

    const fileName = `user-generated/${jobId}-${Date.now()}.jpg`;
    await supabaseAdmin.storage
      .from('content-screenshots')
      .upload(fileName, screenshotBuffer, { contentType: 'image/jpeg' });

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('content-screenshots')
      .getPublicUrl(fileName);

    const { data: insertedContent, error: insertError } = await supabaseAdmin.from('contents').insert({
      type: 'user_created',
      status: 'ready',
      nigerian_category: 'general',
      vibe: job.vibe,
      aspect_ratio: job.aspect_ratio,
      title: content.title,
      caption: content.caption,
      html_template: content.html,
      screenshot_url: publicUrl,
      created_by: job.user_id,
    }).select().single();

    if (insertError) throw insertError;

    await supabaseAdmin
      .from('content_generation_jobs')
      .update({
        status: 'completed',
        result_content_id: insertedContent.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    return insertedContent;
  } catch (err) {
    await supabaseAdmin
      .from('content_generation_jobs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    throw err;
  }
}

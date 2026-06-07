import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://dede.app';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Commands ──

bot.start(async (ctx) => {
  const webAppUrl = `${WEBAPP_URL}?start=${ctx.chat.id}`;

  await ctx.reply(
    '🎯 *Welcome to DEDE!*\n\n'
    + 'Get curated Nigerian content for your WhatsApp and Telegram status.\n'
    + '• Browse 500+ posts updated daily\n'
    + '• Generate custom AI content\n'
    + '• Auto-publish on schedule\n\n'
    + 'Tap the button below to open the Mini App:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.webApp('Open DEDE', webAppUrl),
          ],
        ],
      },
    },
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    '*DEDE Bot Commands*\n\n'
    + '/start — Open the Mini App\n'
    + '/feed — Latest 5 posts\n'
    + '/stats — Your posting stats\n'
    + '/settings — Manage preferences\n'
    + '/help — Show this message',
    { parse_mode: 'Markdown' },
  );
});

bot.command('feed', async (ctx) => {
  const { data } = await supabase
    .from('contents')
    .select('id, title, caption, nigerian_category, vibe, screenshot_url')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) {
    await ctx.reply('No content available yet. Check back later.');
    return;
  }

  for (const item of data) {
    const caption = [
      item.title && `*${item.title}*`,
      item.caption,
      `#${item.nigerian_category} #${item.vibe}`,
    ].filter(Boolean).join('\n\n');

    if (item.screenshot_url) {
      await ctx.replyWithPhoto(item.screenshot_url, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.webApp('View in DEDE', `${WEBAPP_URL}/content/${item.id}`),
            ],
          ],
        },
      });
    } else {
      await ctx.reply(caption || 'Content available in the Mini App', {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.webApp('Open DEDE', `${WEBAPP_URL}/content/${item.id}`)],
          ],
        },
      });
    }
  }
});

bot.command('stats', async (ctx) => {
  const telegramId = String(ctx.from.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_id', telegramId)
    .single();

  if (!profile) {
    await ctx.reply('Link your Telegram in the Mini App first: /start');
    return;
  }

  const { count: postedCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('event', 'posted');

  await ctx.reply(
    `📊 *Your DEDE Stats*\n\n`
    + `Total posts: ${postedCount || 0}\n\n`
    + 'Open the Mini App for detailed analytics.',
    { parse_mode: 'Markdown' },
  );
});

bot.command('settings', async (ctx) => {
  await ctx.reply('Open DEDE to manage your settings:', {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.webApp('Settings', `${WEBAPP_URL}/settings`)],
      ],
    },
  });
});

// ── Launch ──

const startBot = async () => {
  try {
    // Set webhook (production) or use polling (dev)
    if (process.env.WEBHOOK_URL) {
      await bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/api/webhooks/telegram`);
      console.log(`Bot webhook set to ${process.env.WEBHOOK_URL}/api/webhooks/telegram`);
    } else {
      await bot.launch();
      console.log('Bot started in polling mode');
    }
  } catch (err) {
    console.error('Failed to start bot:', err);
    process.exit(1);
  }
};

startBot();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

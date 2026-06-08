import crypto from 'node:crypto';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { supabase, supabaseAdmin } from '../db.js';

function deriveEmail(telegramId: string): string {
  return `tg_${telegramId}@dede.app`;
}

function derivePassword(telegramId: string, botToken: string): string {
  const hash = crypto.createHash('sha256').update(`${telegramId}:${botToken}`).digest('hex');
  return hash.slice(0, 32) + 'Aa1!';
}

export async function authRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.post('/telegram', async (request, reply) => {
    const { initData } = request.body as { initData: string };

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return reply.status(500).send({ error: 'Telegram bot not configured' });
    }

    // Verify initData HMAC
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const botKey = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(botToken));
    const botKeyHex = Array.from(new Uint8Array(botKey))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const secretKey2 = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(botKeyHex),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const calculatedHash = await crypto.subtle.sign('HMAC', secretKey2, new TextEncoder().encode(dataCheckString));
    const calculatedHex = Array.from(new Uint8Array(calculatedHash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (calculatedHex !== hash) {
      return reply.status(401).send({ error: 'Invalid Telegram data' });
    }

    // Extract user from initData
    const userStr = urlParams.get('user');
    if (!userStr) {
      return reply.status(400).send({ error: 'No user data in initData' });
    }

    const tgUser = JSON.parse(userStr);
    const telegramId = String(tgUser.id);
    const email = deriveEmail(telegramId);
    const password = derivePassword(telegramId, botToken);
    const displayName = tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : '');

    // Check if profile already exists by telegram_id
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (!existingProfile) {
      // First-time user — create auth user
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        return reply.status(500).send({ error: createError.message });
      }

      // Create profile
      const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: createdUser.user.id,
        email,
        telegram_id: telegramId,
        phone_number: tgUser.phone_number || null,
        display_name: displayName,
        trial_ends_at: trialEnds,
      });

      if (profileError) {
        return reply.status(500).send({ error: profileError.message });
      }

      // Create trial subscription
      await supabaseAdmin.from('user_subscriptions').insert({
        user_id: createdUser.user.id,
        plan_id: null,
        status: 'trial',
        starts_at: new Date().toISOString(),
        ends_at: trialEnds,
      });
    } else {
      // Returning user — update profile with latest info
      const updates: Record<string, unknown> = {};
      if (displayName) updates.display_name = displayName;
      if (tgUser.phone_number) updates.phone_number = tgUser.phone_number;

      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from('profiles').update(updates).eq('telegram_id', telegramId);
      }
    }

    // Get auth session
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    return reply.send({
      access_token: signInData?.session?.access_token || null,
      refresh_token: signInData?.session?.refresh_token || null,
      profile,
      is_new_user: !existingProfile,
    });
  });
}

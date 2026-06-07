import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { supabase, supabaseAdmin } from '../db.js';

export async function authRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // Sign up
  app.post('/signup', async (request, reply) => {
    const { email, password, displayName } = request.body as {
      email: string;
      password: string;
      displayName?: string;
    };

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return reply.status(400).send({ error: error.message });
    }

    // Create profile with 14-day trial
    const trialEnds = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from('profiles').insert({
      id: data.user.id,
      email,
      display_name: displayName || email.split('@')[0],
      trial_ends_at: trialEnds,
    });

    // Create trial subscription record
    await supabaseAdmin.from('user_subscriptions').insert({
      user_id: data.user.id,
      plan_id: null,
      status: 'trial',
      starts_at: new Date().toISOString(),
      ends_at: trialEnds,
    });

    return reply.status(201).send({ user: data.user });
  });

  // Sign in
  app.post('/signin', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return reply.status(401).send({ error: error.message });
    }

    return reply.send({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  });

  // Telegram Mini App auth
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

    // Upsert profile
    const { data: profile } = await supabaseAdmin.from('profiles').upsert(
      {
        telegram_id: telegramId,
        display_name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
      },
      { onConflict: 'telegram_id' },
    ).select().single();

    return reply.send({ profile });
  });
}

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { supabaseAdmin } from '../db.js';

export async function webhookRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // Paystack webhook
  app.post('/paystack', async (request, reply) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = request.headers['x-paystack-signature'];

    if (!secret || !signature) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Verify signature
    const body = JSON.stringify(request.body);
    const crypto = await import('node:crypto');
    const expectedSig = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    const event = request.body as {
      event: string;
      data: {
        reference: string;
        metadata?: { user_id: string; plan_id: string };
        status: string;
      };
    };

    if (event.event === 'charge.success' && event.data.metadata) {
      const { user_id, plan_id } = event.data.metadata;

      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', plan_id)
        .single();

      if (plan) {
        const startsAt = new Date().toISOString();
        const endsAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin.from('user_subscriptions').upsert({
          user_id,
          plan_id,
          status: 'active',
          starts_at: startsAt,
          ends_at: endsAt,
          paystack_ref: event.data.reference,
        }, { onConflict: 'user_id' });
      }
    }

    return reply.status(200).send({ received: true });
  });

  // WhatsApp webhook (Meta)
  app.post('/whatsapp', async (request, reply) => {
    const body = request.body as { entry?: Array<{ changes: Array<{ value: { messages?: Array<unknown>; statuses?: Array<unknown> } }> }> };

    // Process delivery receipts and incoming messages
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.value.messages) {
          // Handle incoming messages
          console.log('WhatsApp message received:', change.value.messages);
        }
        if (change.value.statuses) {
          // Handle delivery/read receipts
          for (const status of change.value.statuses) {
            // Log analytics event
            console.log('WhatsApp status update:', status);
          }
        }
      }
    }

    return reply.status(200).send({ received: true });
  });

  // WhatsApp webhook verification (Meta)
  app.get('/whatsapp', async (request, reply) => {
    const query = request.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'dede_webhook_verify';

    if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === verifyToken) {
      return reply.status(200).send(query['hub.challenge']);
    }

    return reply.status(403).send({ error: 'Verification failed' });
  });

  // Telegram bot webhook
  app.post('/telegram', async (_request, reply) => {
    // Forward update to bot service via internal queue or process inline
    // For now, acknowledge receipt
    return reply.status(200).send({ ok: true });
  });
}

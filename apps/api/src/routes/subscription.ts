import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { supabaseAdmin } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export async function subscriptionRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // List available plans
  app.get('/plans', async () => {
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('active', true)
      .order('duration_days', { ascending: true });

    if (error) throw new Error(error.message);
    return { plans: data };
  });

  // Get user's current subscription
  app.get('/my', { preHandler: [requireAuth] }, async (request) => {
    const userId = request.userId!;

    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { subscription: data };
  });

  // Create Paystack checkout
  app.post('/checkout', { preHandler: [requireAuth] }, async (request, reply) => {
    const { planId } = request.body as { planId: string };
    const userId = request.userId!;

    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return reply.status(500).send({ error: 'Payment not configured' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Initiate Paystack transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile?.email,
        amount: plan.price_kobo,
        metadata: {
          user_id: userId,
          plan_id: planId,
        },
        callback_url: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/subscription/success`,
      }),
    });

    const paystackData = (await paystackRes.json()) as { status: boolean; data: { authorization_url: string; reference: string } };

    if (!paystackData.status) {
      return reply.status(500).send({ error: 'Failed to initiate payment' });
    }

    return reply.send({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  });
}

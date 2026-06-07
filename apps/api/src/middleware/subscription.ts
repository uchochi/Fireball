import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../db.js';

export const requireSubscription = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.userId) {
    return reply.status(401).send({ error: 'Not authenticated' });
  }

  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('status, ends_at')
    .eq('user_id', request.userId)
    .maybeSingle();

  if (error) {
    return reply.status(500).send({ error: 'Failed to check subscription' });
  }

  if (!data) {
    return reply.status(403).send({ error: 'No active subscription. Start a free trial or subscribe.' });
  }

  const now = new Date();
  const endsAt = new Date(data.ends_at);

  if (data.status === 'expired' || (data.status === 'active' && endsAt < now)) {
    return reply.status(403).send({ error: 'Subscription expired.' });
  }

  if (data.status === 'cancelled') {
    return reply.status(403).send({ error: 'Subscription cancelled.' });
  }
};

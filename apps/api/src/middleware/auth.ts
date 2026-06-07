import type { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../db.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  request.userId = data.user.id;
};

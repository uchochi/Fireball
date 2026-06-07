import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { supabase, supabaseAdmin } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireSubscription } from '../middleware/subscription.js';

export async function contentRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // Public: browse ready content (paginated)
  app.get('/feed', async (request) => {
    const query = request.query as {
      category?: string;
      vibe?: string;
      cursor?: string;
      limit?: string;
    };

    let dbQuery = supabase
      .from('contents')
      .select('*')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(Number(query.limit) || 20);

    if (query.category) {
      dbQuery = dbQuery.eq('nigerian_category', query.category);
    }
    if (query.vibe) {
      dbQuery = dbQuery.eq('vibe', query.vibe);
    }
    if (query.cursor) {
      dbQuery = dbQuery.lt('created_at', query.cursor);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(error.message);
    }

    const nextCursor = data?.length === (Number(query.limit) || 20) ? data[data.length - 1]?.created_at : null;

    return { data, nextCursor };
  });

  // Get single content
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return reply.status(404).send({ error: 'Content not found' });
    }

    return reply.send(data);
  });

  // Create custom content (subscription required)
  app.post('/generate', { preHandler: [requireAuth, requireSubscription] }, async (request, reply) => {
    const { prompt, aspectRatio, vibe, imageUrls } = request.body as {
      prompt: string;
      aspectRatio?: string;
      vibe?: string;
      imageUrls?: string[];
    };

    const userId = request.userId!;

    // Place a generation job — AI pipeline will process async
    const { data, error } = await supabaseAdmin.from('content_generation_jobs').insert({
      user_id: userId,
      prompt,
      aspect_ratio: aspectRatio || '1:1',
      vibe: vibe || 'english',
      image_urls: imageUrls || [],
      status: 'pending',
    }).select().single();

    if (error) {
      return reply.status(500).send({ error: 'Failed to create generation job' });
    }

    return reply.status(201).send({ jobId: data.id });
  });
}

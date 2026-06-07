import Fastify from 'fastify';
import cors from '@fastify/cors';
import { envSchema } from './config.js';
import { authRoutes } from './routes/auth.js';
import { contentRoutes } from './routes/content.js';
import { subscriptionRoutes } from './routes/subscription.js';
import { webhookRoutes } from './routes/webhooks.js';

const start = async () => {
  const env = envSchema.parse(process.env);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(contentRoutes, { prefix: '/api/content' });
  await app.register(subscriptionRoutes, { prefix: '/api/subscription' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });

  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`API server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

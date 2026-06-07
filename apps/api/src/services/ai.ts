import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:5173',
    'X-Title': 'DEDE',
  },
});

const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

export interface GeneratedContent {
  title: string;
  caption: string;
  html: string;
  category: string;
  vibe: 'pidgin' | 'english';
}

const categoryPrompt = (category: string, vibe: 'pidgin' | 'english') => {
  const prompts: Record<string, string> = {
    politics: vibe === 'pidgin'
      ? 'Write a short, witty Nigerian political observation in pidgin English. Keep it sharp but not offensive.'
      : 'Write a short, witty observation about Nigerian politics. Keep it sharp but not offensive.',
    humour: vibe === 'pidgin'
      ? 'Write a funny everyday Nigerian scenario in pidgin English.'
      : 'Write a funny everyday Nigerian scenario. Relatable and light-hearted.',
    jokes: vibe === 'pidgin'
      ? 'Tell a short Nigerian joke in pidgin English.'
      : 'Tell a short Nigerian joke. Clean humour.',
    hustle_motivation: vibe === 'pidgin'
      ? 'Write a short hustle motivation quote in pidgin English for someone grinding in Nigeria.'
      : 'Write a short hustle motivation quote for someone grinding in Nigeria.',
    relationship: vibe === 'pidgin'
      ? 'Write a short relationship observation (humorous or consoling) in pidgin English, Nigerian context.'
      : 'Write a short relationship observation (humorous or consoling) in a Nigerian context.',
    quotes: vibe === 'pidgin'
      ? 'Write a short original quote in pidgin English that resonates with the Nigerian experience.'
      : 'Write a short original quote that resonates with the Nigerian experience.',
    national_commentary: vibe === 'pidgin'
      ? 'Write a short thoughtful commentary about a current or perennial Nigerian situation in pidgin English.'
      : 'Write a short thoughtful commentary about a current or perennial Nigerian situation.',
  };
  return prompts[category] || prompts.humour;
};

export async function generateContent(
  category: string,
  vibe: 'pidgin' | 'english',
  aspectRatio: string,
): Promise<GeneratedContent> {
  const [w, h] = aspectRatio.split(':').map(Number);
  const maxWidth = w && h && w / h > 1 ? 600 : 400;
  const fontSize = w && h && w / h > 1 ? '28px' : '24px';

  const systemPrompt = `You are a Nigerian content creator for WhatsApp and Telegram status posts.
Generate content that feels authentically Nigerian — relatable, culturally aware, and engaging.

Output JSON:
{
  "title": "short title (max 60 chars)",
  "caption": "one-sentence description (max 120 chars)",
  "html": "a self-contained HTML document that renders the content beautifully. Use inline CSS. No external fonts. Dark background (#0f0f0f), accent color (#00d4aa). Text should be white/light. The design should be visually striking for a status post at ${aspectRatio} aspect ratio. Max width ${maxWidth}px. Font size ~${fontSize}. Include appropriate decorative elements."
}`;

  const userPrompt = categoryPrompt(category, vibe)!;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content generated');

  return JSON.parse(content) as GeneratedContent;
}

export async function generateCustomContent(
  prompt: string,
  _vibe: 'pidgin' | 'english',
  aspectRatio: string,
  imageUrls?: string[],
): Promise<GeneratedContent> {
  const [w, h] = aspectRatio.split(':').map(Number);
  const maxWidth = w && h && w / h > 1 ? 600 : 400;
  const fontSize = w && h && w / h > 1 ? '28px' : '24px';

  const systemPrompt = `You are a Nigerian content creator for WhatsApp and Telegram status posts.
The user has given you a specific request. Fulfill it creatively and authentically.

Output JSON:
{
  "title": "short title (max 60 chars)",
  "caption": "one-sentence description (max 120 chars)",
  "html": "a self-contained HTML document that renders the content beautifully. Use inline CSS. No external fonts. Dark background (#0f0f0f), accent color (#00d4aa). Text white/light. Status post look at ${aspectRatio} aspect ratio. Max width ${maxWidth}px. Font size ~${fontSize}. Include decorative elements. ${
    imageUrls?.length ? `Include these images in the design: ${imageUrls.join(', ')}` : ''
  }"
}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content generated');

  return JSON.parse(content) as GeneratedContent;
}

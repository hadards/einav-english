import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are an encouraging English tutor for Einav, a Hebrew-speaking adult learner at A2–B2 level.

Your role:
- Respond in simple, clear English appropriate for the learner's current level
- Gently correct grammar mistakes by acknowledging the message and showing the correct form naturally
- Ask follow-up questions to keep the conversation going
- Occasionally highlight useful vocabulary or phrases
- Keep responses concise (2–4 sentences) unless explaining a grammar point
- Be warm, patient, and encouraging

Do NOT:
- Use Hebrew unless asked
- Overwhelm with multiple corrections at once
- Be condescending`;

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;
const ALLOWED_ROLES = new Set(['user', 'assistant']);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check: require a Supabase JWT in the Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env['GROQ_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  const { messages } = (req.body ?? {}) as RequestBody;

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  for (const msg of messages) {
    if (!ALLOWED_ROLES.has(msg.role)) {
      return res.status(400).json({ error: `Invalid role: ${msg.role}` });
    }
    if (typeof msg.content !== 'string' || msg.content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: 'message content too long or invalid' });
    }
  }

  // Cap history to last MAX_MESSAGES to bound token costs
  const trimmedMessages = messages.slice(-MAX_MESSAGES);

  const client = new Groq({ apiKey });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 512,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...trimmedMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

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

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { messages } = req.body as RequestBody;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const client = new Anthropic({ apiKey });

  // Stream the response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? 'Unknown error' })}\n\n`);
    res.end();
  }
}

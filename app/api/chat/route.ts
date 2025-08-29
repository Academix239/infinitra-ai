import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model, temperature } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ reply: '🤖 Mock Reply: Configure your OPENAI_API_KEY in .env.local to enable real AI responses.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const sys = { role: 'system', content: 'You are a concise, helpful assistant.' };

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      stream: true,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      messages: [sys, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) return new Response('Upstream error', { status: 500 });

  const stream = new ReadableStream({
    start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const pump = async () => {
        const { value, done } = await reader.read();
        if (done) return controller.close();
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const data = t.slice(5).trim();
          if (data === '[DONE]') return controller.close();
          try { const j = JSON.parse(data); const delta = j?.choices?.[0]?.delta?.content; if (delta) controller.enqueue(encoder.encode(delta)); } catch {}
        }
        pump();
      };
      pump();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

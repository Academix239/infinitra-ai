type Msg = { role: 'user' | 'assistant'; content: string };

export async function openaiChat(messages: Msg[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) return null;

  const sys = { role: 'system', content: 'You are a helpful AI assistant. Keep answers concise and clear.' };
  const prepared = [sys, ...messages].map(m => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: prepared,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return typeof text === 'string' ? text : null;
}

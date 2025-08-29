'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import Settings from './Settings';

type Msg = { role: 'user' | 'assistant'; content: string };
const STORE_KEY = 'ai_chat_history_v1';

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return JSON.parse(raw) as Msg[];
      } catch {}
    }
    return [
      {
        role: 'assistant' as const,
        content:
          'Namaste! Main aapka AI guide hoon — atom se universe tak sabka gyaan. Kuch bhi poochiye ✨',
      },
    ];
  });

  const [settings, setSettings] = useState<{ model: string; temperature: number }>({
    model: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const cdTimer = useRef<any>(null);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    cdTimer.current = setTimeout(() => setCooldown((c: number) => c - 1), 1000);
    return () => clearTimeout(cdTimer.current);
  }, [cooldown]);

  const truncate = (arr: Msg[], max = 10) => arr.slice(-max);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || cooldown > 0) return;
    setCooldown(1);
    setInput('');

    // add user message
    const next: Msg[] = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: truncate(next),
          model: settings.model,
          temperature: settings.temperature,
        }),
      });

      const ctype = res.headers.get('Content-Type') || '';

      // --- JSON reply path
      if (ctype.includes('application/json')) {
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { role: 'assistant' as const, content: data.reply ?? 'No reply' },
        ]);
        setLoading(false);
        return;
      }

      // --- Streaming path
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      // push an empty assistant bubble to update as stream arrives
      setMessages((m) => [...m, { role: 'assistant' as const, content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: acc } as Msg;
          return copy;
        });
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant' as const, content: 'Network error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ---- Mic (Speech-to-Text)
  const startMic = () => {
    const SR: any =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert('Speech Recognition not supported in this browser');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN'; // ya 'hi-IN'
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setInput((prev) => (prev ? prev + ' ' : '') + t);
    };
    rec.start();
  };

  // ---- Speak (TTS)
  const speakLast = () => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!last) return;
    const u = new SpeechSynthesisUtterance(last.content.replace(/[`*_#>-]/g, ' '));
    u.lang = 'en-US'; // 'hi-IN' bhi try kar sakte
    window.speechSynthesis.speak(u);
  };

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages((msgs) => [msgs[0]]);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {}
  };

  const onSettingsChange = useCallback(
    (s: { model: string; temperature: number }) => setSettings(s),
    [],
  );

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <Settings onChange={onSettingsChange} />
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={startMic}
            className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20"
          >
            🎤 Mic
          </button>
          <button
            onClick={speakLast}
            className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20"
          >
            🔊 Speak
          </button>
          <button
            onClick={exportChat}
            className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20"
          >
            ⬇️ Export
          </button>
          <button
            onClick={clearChat}
            className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      <div className="rounded-[28px] bg-white/4 border border-white/10 backdrop-blur-md p-4 md:p-6">
        <div className="space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mr-auto text-white/60 text-sm md:text-base"
            >
              <span className="inline-block animate-pulse">AI is typing…</span>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Type your message… (Model: ${settings.model})`}
            rows={2}
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 outline-none placeholder:text-white/40 focus:border-brand-400/60 resize-none"
          />
          <button
            onClick={send}
            disabled={loading || cooldown > 0}
            className="h-[44px] rounded-xl bg-brand-500 hover:bg-brand-400 active:scale-[0.99] transition px-4 font-semibold disabled:opacity-60"
          >
            {cooldown > 0 ? `Wait` : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

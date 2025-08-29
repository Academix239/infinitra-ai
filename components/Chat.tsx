'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import Settings from './Settings';

type Msg = { role: 'user' | 'assistant'; content: string };
const STORE_KEY = 'ai_chat_history_v1';

// SSR/client first render always same:
const BASE_WELCOME: Msg[] = [
  { role: 'assistant', content: 'Namaste! Main aapka AI guide hoon — atom se universe tak sabka gyaan. Kuch bhi poochiye ✨' }
];

export default function Chat() {
  // 🔧 FIX: no localStorage in initializer (to avoid hydration mismatch)
  const [messages, setMessages] = useState<Msg[]>(BASE_WELCOME);

  const [settings, setSettings] = useState<{model:string; temperature:number}>({
    model: 'gpt-4o-mini',
    temperature: 0.7
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const cdTimer = useRef<any>(null);

  // 🔧 Mount ke baad history load: server -> localStorage fallback
  useEffect(() => {
    (async () => {
      try {
        // 1) Server DB (if you added /api/history/load)
        const res = await fetch('/api/history/load', { cache: 'no-store' });
        if (res.ok) {
          const serverMsgs = await res.json();
          if (serverMsgs && Array.isArray(serverMsgs) && serverMsgs.length) {
            setMessages(serverMsgs);
            return;
          }
        }
      } catch {}
      // 2) Fallback: localStorage
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(STORE_KEY) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as Msg[];
          if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
        }
      } catch {}
    })();
  }, []);

  // localStorage sync (same as before)
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // cooldown to avoid spam
  useEffect(() => {
    if (cooldown <= 0) return;
    cdTimer.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(cdTimer.current);
  }, [cooldown]);

  const truncate = (arr: Msg[], max = 10) => arr.slice(-max); // simple token-safe

  // (optional) server save helper — safe if you created the API
  const save = async (msgs: Msg[]) => {
    try {
      await fetch('/api/history/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch {}
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || cooldown > 0) return;
    setCooldown(1); // 1 sec cooldown
    setInput('');

    const next = [...messages, { role: 'user', content: text } as Msg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: truncate(next),
          model: settings.model,
          temperature: settings.temperature
        }),
      });

      const ctype = res.headers.get('Content-Type') || '';
      if (ctype.includes('application/json')) {
        const data = await res.json();
        setMessages(m => {
          const updated = [...m, { role: 'assistant', content: data.reply ?? 'No reply' }];
          save(updated); // if API exists; otherwise harmless
          return updated;
        });
        setLoading(false);
        return;
      }

      // streaming
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages(m => [...m, { role: 'assistant', content: '' }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(m => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
      // final persist
      setMessages(m => {
        const finalMsgs = [...m];
        save(finalMsgs);
        return finalMsgs;
      });
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ---- Mic (Speech-to-Text)
  const startMic = () => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert('Speech Recognition not supported in this browser'); return; }
    const rec = new SR();
    rec.lang = 'en-IN'; // ya 'hi-IN'
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r:any)=>r[0].transcript).join(' ');
      setInput(prev => (prev ? prev + ' ' : '') + t);
    };
    rec.start();
  };

  // ---- Speak (TTS)
  const speakLast = () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    const u = new SpeechSynthesisUtterance(last.content.replace(/[`*_#>-]/g,' '));
    u.lang = 'en-US'; // 'hi-IN' bhi try kar sakte
    window.speechSynthesis.speak(u);
  };

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chat.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages(() => {
      const base = [...BASE_WELCOME];
      save(base);
      return base;
    });
    try { localStorage.removeItem(STORE_KEY); } catch {}
  };

  const onSettingsChange = useCallback((s: {model:string; temperature:number}) => setSettings(s), []);

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <Settings onChange={onSettingsChange} />
        <div className="flex items-center gap-2 text-sm">
          <button onClick={startMic} className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20">🎤 Mic</button>
          <button onClick={speakLast} className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20">🔊 Speak</button>
          <button onClick={exportChat} className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20">⬇️ Export</button>
          <button onClick={clearChat} className="rounded-md bg-white/10 px-2 py-1 border border-white/15 hover:bg-white/20">🧹 Clear</button>
        </div>
      </div>

      <div className="rounded-[28px] bg-white/4 border border-white/10 backdrop-blur-md p-4 md:p-6">
        <div className="space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m, i) => <MessageBubble key={i} role={m.role} content={m.content} />)}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto text-white/60 text-sm md:text-base">
              <span className="inline-block animate-pulse">AI is typing…</span>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Type your message… (Model: ${settings.model})`}
            rows={2}
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 outline-none placeholder:text-white/40 focus:border-brand-400/60 resize-none"
          />
          <button
            onClick={send}
            disabled={loading || cooldown>0}
            className="h-[44px] rounded-xl bg-brand-500 hover:bg-brand-400 active:scale-[0.99] transition px-4 font-semibold disabled:opacity-60"
          >
            {cooldown>0 ? `Wait` : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

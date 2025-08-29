import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

type Props = { role: 'user' | 'assistant'; content: string };

function CodeBlock({ children }: { children?: any }) {
  const code = typeof children === 'string' ? children : String(children?.[0] ?? '');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 1200); } catch {}
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-black/60 border border-white/10 p-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-xs rounded-md bg-white/10 border border-white/15 px-2 py-1 hover:bg-white/20"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
        isUser
          ? 'ml-auto bg-brand-500/20 border border-brand-400/30'
          : 'mr-auto bg-white/5 border border-white/10'
      }`}
    >
      <article className="prose prose-invert prose-sm md:prose-base max-w-none">
        <ReactMarkdown
          components={{
            code({ inline, children }) {
              if (inline) return <code className="bg-white/10 px-1.5 py-0.5 rounded">{children}</code>;
              return <CodeBlock>{children}</CodeBlock>;
            },
            a({ href, children }) {
              return <a href={href as string} target="_blank" className="underline decoration-dotted">{children}</a>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </motion.div>
  );
}

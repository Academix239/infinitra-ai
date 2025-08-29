'use client';
import { useEffect, useState } from 'react';

type Settings = { model: string; temperature: number };
const KEY = 'ai_settings_v1';

export default function Settings({ onChange }: { onChange: (s: Settings)=>void }) {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>({ model: 'gpt-4o-mini', temperature: 0.7 });

  // Mount ke baad hi localStorage read karo
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Settings;
        setSettings(parsed);
        onChange(parsed);
        return;
      }
    } catch {}
    onChange(settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jab settings change hon, store + parent notify
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
    onChange(settings);
  }, [settings, mounted, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="flex items-center gap-2">
        <span className="text-white/70">Model</span>
        <select
          value={settings.model}
          onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
          className="rounded-md bg-white/10 border border-white/15 px-2 py-1 outline-none"
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="o3-mini">o3-mini</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-white/70">Temp</span>
        <input
          type="range" min={0} max={1} step={0.1}
          value={settings.temperature}
          onChange={e => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
        />
        {/* span pe hydration warning suppress taaki SSR/CSR number mismatch error na aaye */}
        <span suppressHydrationWarning className="w-8 text-right">
          {settings.temperature.toFixed(1)}
        </span>
      </label>
    </div>
  );
}

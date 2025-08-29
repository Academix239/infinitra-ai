'use client';
import { motion } from 'framer-motion';
import BackgroundStars from '../components/BackgroundStars';

import Chat from '../components/Chat';

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <BackgroundStars />   {/* z-0 */}
             {/* z-1 subtle orb */}

      <section className="relative z-10 container mx-auto px-4 py-14 md:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="gradient-text">Atom → Universe</span> AI Platform
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-4 text-base md:text-lg text-white/70"
          >
            Build your own <span className="font-semibold">AI Fiesta–style</span> experience with premium animations,
            blazing-fast Next.js, and a clean chat interface.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-10 md:mt-14 mx-auto max-w-3xl"
        >
          <Chat />
        </motion.div>

        <footer className="relative z-10 mt-10 text-center text-xs text-white/40">
          <p>Made with Next.js + Tailwind + Framer Motion — swap provider in <code>lib/providers/openai.ts</code>.</p>
        </footer>
      </section>
    </main>
  );
}

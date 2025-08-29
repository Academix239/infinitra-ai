import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'AI Fiesta — Atom to Universe Intelligence',
  description: 'A premium AI platform starter built with Next.js + Tailwind',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

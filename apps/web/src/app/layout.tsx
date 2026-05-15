import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@bounty/ui/styles';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BountyHub — Decentralized OSS Bounty Platform',
    template: '%s | BountyHub',
  },
  description:
    'AI-powered bounty coordination for open-source ecosystems. Match contributors, automate escrow, verify PRs, and build reputation on-chain.',
  keywords: ['bounty', 'open source', 'blockchain', 'stellar', 'soroban', 'AI', 'contributors'],
  authors: [{ name: 'BountyHub' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bountyhub.dev',
    siteName: 'BountyHub',
    title: 'BountyHub — Decentralized OSS Bounty Platform',
    description: 'AI-powered bounty coordination for open-source ecosystems.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BountyHub',
    description: 'AI-powered bounty coordination for open-source ecosystems.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a1a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#050510] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://rentvsbuy.netlify.app'
  ),
  title: {
    default: 'Rent vs Buy: a long-term calculator for UK homebuyers',
    template: '%s · Rent vs Buy',
  },
  description:
    'Compare the 25-year financial outcome of buying a home versus renting and investing the difference. Proper stamp duty, a full mortgage schedule, and honest assumptions you can adjust.',
  keywords: [
    'rent vs buy calculator',
    'UK mortgage calculator',
    'stamp duty',
    'buying a house UK',
    'renting vs buying',
    'investment calculator',
    'ISA',
  ],
  authors: [{ name: 'Rent vs Buy' }],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Rent vs Buy',
    title: 'Rent vs Buy: a long-term calculator for UK homebuyers',
    description:
      'Compare the 25-year financial outcome of buying a home versus renting and investing the difference.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rent vs Buy: a long-term calculator for UK homebuyers',
    description:
      'Compare the 25-year financial outcome of buying a home versus renting and investing the difference.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

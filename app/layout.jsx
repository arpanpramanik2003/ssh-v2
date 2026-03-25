import './globals.css';
import Providers from './providers';
import { Analytics } from '@vercel/analytics/next';

const SITE_URL = 'https://ssh-v2.arpanpramanik.dev';

export const metadata = {
  // =====================
  // PRIMARY SEO
  // =====================
  title: {
    template: '%s | Smart Student Hub',
    default: 'Smart Student Hub | Academic Productivity Platform',
  },
  description:
    'Smart Student Hub is a modern academic productivity platform designed to help students manage learning resources, track progress, and enhance performance efficiently.',
  keywords: [
    'Smart Student Hub',
    'Student Platform',
    'Academic Productivity',
    'Learning Dashboard',
    'Student Management',
    'Study Tools',
  ],
  authors: [{ name: 'Arpan Pramanik' }],
  robots: 'index, follow',
  canonical: SITE_URL,

  // =====================
  // PWA & FAVICON
  // =====================
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },

  // =====================
  // OPEN GRAPH (SOCIAL SHARE)
  // =====================
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Smart Student Hub | Academic Productivity Platform',
    description:
      'A modern academic productivity platform to help students manage resources, track performance, and improve learning efficiency.',
    images: [
      {
        url: `${SITE_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
        alt: 'Smart Student Hub Logo',
      },
    ],
    siteName: 'Smart Student Hub',
    locale: 'en_US',
  },

  // =====================
  // TWITTER CARD
  // =====================
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Student Hub | Academic Productivity Platform',
    description:
      'A smart academic productivity platform designed to enhance student learning and performance.',
    images: [`${SITE_URL}/android-chrome-512x512.png`],
  },
};

export const viewport = {
  themeColor: '#0b0f19',
};

export default function RootLayout({ children }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Smart Student Hub',
    url: SITE_URL,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    creator: {
      '@type': 'Person',
      name: 'Arpan Pramanik',
    },
    description:
      'A web-based academic productivity platform designed to help students manage learning and track performance.',
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

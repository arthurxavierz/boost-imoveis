import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import './globals.css';

const serif = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--f-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Boost Gestão',
    template: '%s | Boost Gestão',
  },
  description: 'Sistema de gestão da Boost Negócios Imobiliários.',
  // Sistema interno nao entra em buscador em hipotese nenhuma.
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/assets/marca/boost-favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#0c2340',
  width: 'device-width',
  initialScale: 1,
  // O painel e usado muito no celular. Travar a escala em 1 evita o
  // zoom acidental de dois dedos no meio de um formulario, mas
  // maximumScale fica em 5 para nao impedir quem precisa ampliar.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import { BarraProgresso } from '@/componentes/BarraProgresso';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { BotaoWhatsApp } from '@/componentes/BotaoWhatsApp';
import { AvisoCookies } from '@/componentes/AvisoCookies';
import { ehDominioOficial, SITE } from '@/lib/site';
import { jsonLdImobiliaria } from '@/lib/seo';

import './globals.css';

/**
 * Fraunces nos titulos e Inter no texto.
 *
 * Fraunces e uma serifada com eixo optico: em corpo grande ela fica
 * elegante e com contraste alto, e em corpo pequeno engrossa sozinha
 * para nao sumir. E o que da ao site o ar editorial de revista de
 * arquitetura, em vez do visual de portal de classificados.
 */
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

/**
 * metadataBase e o que faz as imagens de compartilhamento (Open Graph)
 * virarem URL absoluta. Sem ela, o WhatsApp e o Instagram nao conseguem
 * montar a previa do link do imovel.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nome} | Imóveis de alto padrão em Uberlândia`,
    template: `%s | ${SITE.nomeCurto}`,
  },
  description: SITE.descricao,
  keywords: [
    'imóveis Uberlândia',
    'apartamento alto padrão Uberlândia',
    'casa em condomínio Uberlândia',
    'cobertura Uberlândia',
    'imobiliária Uberlândia',
    'lançamentos Uberlândia',
  ],
  authors: [{ name: SITE.nome }],
  creator: SITE.nome,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE.url,
    siteName: SITE.nome,
    title: `${SITE.nome} | Imóveis de alto padrão em Uberlândia`,
    description: SITE.descricao,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.nome,
    description: SITE.descricao,
  },
  // Fora do domínio oficial o site inteiro sai como noindex. Ver o
  // comentário em robots.ts: staging indexado vira concorrente do
  // site real pelos mesmos termos.
  robots: ehDominioOficial()
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
      }
    : { index: false, follow: false, nocache: true },
  icons: { icon: '/assets/marca/boost-favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#070707',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {/* Identifica a imobiliaria para o Google. E o que habilita o
            painel de negocio local na busca e no Maps. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdImobiliaria()) }}
        />

        <BarraProgresso />
        <Cabecalho />
        <main>{children}</main>
        <Rodape />
        <BotaoWhatsApp />

        {/* Selo da marca no canto oposto ao WhatsApp. Leva ao topo, que
            e o gesto que a pessoa procura depois de rolar uma listagem
            longa, e mantem a assinatura presente sem ocupar conteudo. */}
        <a className="selo-flutuante" href="#" aria-label="Voltar ao topo">
          <i aria-hidden="true" />
        </a>

        <AvisoCookies />
      </body>
    </html>
  );
}

import Image from 'next/image';
import Link from 'next/link';

import { buscarDestaques, buscarRecentes, type Facetas } from '@boost/db';

import { BrilhoPonteiro } from '@/componentes/BrilhoPonteiro';
import { BuscaHero } from '@/componentes/BuscaHero';
import { CartaoCondominio } from '@/componentes/CartaoCondominio';
import { Contador } from '@/componentes/Contador';
import { DestaquesComAbas } from '@/componentes/DestaquesComAbas';
import { Esteira } from '@/componentes/Esteira';
import { Newsletter } from '@/componentes/Newsletter';
import { Revelar } from '@/componentes/Revelar';
import { SecaoHero } from '@/componentes/SecaoHero';
import { TituloRevelado } from '@/componentes/TituloRevelado';
import { IconeCasa, IconeSeta, IconeWhatsApp } from '@/componentes/Icones';
import { carregarCondominios, carregarFacetas } from '@/lib/dados';
import { imagemDoHero } from '@/lib/hero';
import { destaquesVitrine, recentesVitrine, semBanco } from '@/lib/demonstracao';
import { ATALHOS_HERO, SITE, linkWhatsApp } from '@/lib/site';
import { supabase } from '@/lib/supabase';

/**
 * A home e regenerada a cada 5 minutos. O visitante recebe HTML pronto
 * do CDN, o que mantem a pagina rapida e indexavel, e um imovel
 * publicado no sistema de gestao aparece aqui em poucos minutos, sem
 * precisar de novo deploy.
 */
export const revalidate = 300;

export default async function PaginaInicial() {
  const [destaques, recentes, condominios, facetas] = await Promise.all([
    carregar(() => buscarDestaques(supabase(), 8), () => destaquesVitrine(8), []),
    carregar(() => buscarRecentes(supabase(), 8), () => recentesVitrine(8), []),
    carregarCondominios({ limite: 10 }),
    carregarFacetas(),
  ]);

  const luxo = condominios.filter((c) => c.luxo);
  const vitrineCondominios = luxo.length >= 4 ? luxo : condominios;

  // As buscas mais procuradas saem dos bairros com mais imoveis, e nao de
  // uma lista escrita a mao. Assim o bloco acompanha a carteira sozinho
  // quando a importacao trouxer bairro novo.
  const procurados = montarProcurados(facetas);
  const heroImagem = imagemDoHero();

  return (
    <>
      {/* ---------- ABERTURA ---------- */}
      <SecaoHero>
        <div className="hero-fundo" aria-hidden="true">
          {heroImagem && (
            <Image
              src={heroImagem}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>
        {!heroImagem && <div className="hero-cidade" aria-hidden="true" />}
        <div className="hero-veu" aria-hidden="true" />

        <div className="container hero-conteudo">
          <span className="rotulo">Uberlândia e região</span>

          <h1 className="titulo-1">
            <span className="linha-mascara">
              <span style={{ '--atraso': '120ms' } as React.CSSProperties}>
                Os melhores imóveis
              </span>
            </span>
            <span className="linha-mascara">
              <span style={{ '--atraso': '260ms' } as React.CSSProperties}>
                da região estão <em className="destaque-italico">aqui</em>
              </span>
            </span>
          </h1>

          <p className="hero-texto">
            Curadoria de alto padrão, condomínios de luxo, áreas rurais e oportunidades de
            investimento. Cada endereço da carteira passa por visita e checagem de documentação
            antes de chegar até você.
          </p>

          <BuscaHero
            bairros={facetas.bairros}
            cidades={facetas.cidades}
            condominios={facetas.condominios}
          />

          <div className="atalhos">
            {ATALHOS_HERO.map((a) => (
              <Link key={a.href} className="atalho" href={a.href}>
                {a.rotulo}
                <IconeSeta />
              </Link>
            ))}
          </div>
        </div>

        <span className="rolar" aria-hidden="true">
          <span className="rolar-trilho" />
          Role
        </span>
      </SecaoHero>

      {/* ---------- NUMEROS ---------- */}
      <div className="container">
        <Revelar>
          <div className="faixa-numeros">
            <div className="numero-bloco">
              <span className="numero-valor">
                <Contador ate={180} prefixo="R$ " sufixo=" mi" />
              </span>
              <span className="numero-rotulo">Em VGV negociado</span>
            </div>
            <div className="numero-bloco">
              <span className="numero-valor">
                <Contador ate={12} />
              </span>
              <span className="numero-rotulo">Anos de mercado</span>
            </div>
            <div className="numero-bloco">
              <span className="numero-valor">
                <Contador ate={400} prefixo="+" />
              </span>
              <span className="numero-rotulo">Famílias atendidas</span>
            </div>
            <div className="numero-bloco">
              <span className="numero-valor">
                <Contador ate={38} sufixo=" dias" />
              </span>
              <span className="numero-rotulo">Média para vender</span>
            </div>
          </div>
        </Revelar>
      </div>

      {/* ---------- CONDOMINIOS ---------- */}
      {vitrineCondominios.length > 0 && (
        <section className="secao">
          <div className="container">
            <Revelar>
              <div className="cabecalho-secao">
                <div>
                  <span className="rotulo">Onde a cidade quer morar</span>
                  <TituloRevelado texto="Condomínios de alto padrão" grifo="alto padrão" />
                  <p className="texto-apoio" style={{ marginTop: 18 }}>
                    Conhecemos a planta, a incidência de sol e o histórico de negociação de cada um
                    destes endereços. É o que permite dizer, antes da visita, se o imóvel serve para
                    você.
                  </p>
                </div>
                <Link className="link-seta" href="/condominios">
                  Ver todos os condomínios
                  <IconeSeta />
                </Link>
              </div>
            </Revelar>

            <Revelar efeito="mascara">
              <BrilhoPonteiro>
                <Esteira rotulo="Condomínios em destaque">
                  {vitrineCondominios.map((c, i) => (
                    <CartaoCondominio key={c.id} condominio={c} prioridade={i < 3} />
                  ))}
                </Esteira>
              </BrilhoPonteiro>
            </Revelar>
          </div>
        </section>
      )}

      {/* ---------- DESTAQUES ---------- */}
      {destaques.length > 0 && (
        <section className="secao secao-carvao">
          <div className="container">
            <Revelar>
              <BrilhoPonteiro>
                <DestaquesComAbas
                  destaques={destaques}
                  recentes={recentes.length > 0 ? recentes : destaques}
                />
              </BrilhoPonteiro>
            </Revelar>
          </div>
        </section>
      )}

      {/* ---------- MAIS PROCURADOS ---------- */}
      {procurados.length > 0 && (
        <section className="secao">
          <div className="container">
            <Revelar>
              <div className="cabecalho-secao">
                <div>
                  <span className="rotulo">Mais procurados</span>
                  <TituloRevelado texto="O que a região está buscando" />
                </div>
              </div>
            </Revelar>

            <Revelar efeito="mascara">
              <Esteira rotulo="Buscas mais procuradas">
                {procurados.map((p) => (
                  <Link key={p.href} href={p.href} className="cartao-busca">
                    <span className="cartao-busca-fundo" data-cover={p.cover} aria-hidden="true" />
                    <span className="cartao-busca-texto">
                      <strong>{p.rotulo}</strong>
                      <small>{p.apoio}</small>
                    </span>
                  </Link>
                ))}
              </Esteira>
            </Revelar>
          </div>
        </section>
      )}

      {/* ---------- COMO TRABALHAMOS ---------- */}
      <section className="secao secao-carvao">
        <div className="container">
          <Revelar>
            <div className="cabecalho-secao">
              <div>
                <span className="rotulo">Por que a Boost</span>
                <TituloRevelado
                  texto="Consultoria de verdade, não catálogo de imóveis"
                  grifo="catálogo de imóveis"
                />
                <p className="texto-apoio" style={{ marginTop: 20 }}>
                  Cada consultor trabalha com um número limitado de imóveis. É o que permite
                  conhecer o condomínio, a planta, a incidência de sol e o histórico de negociação
                  daquele endereço específico.
                </p>
              </div>
            </div>
          </Revelar>

          <div className="grade">
            {DIFERENCIAIS.map((item, i) => (
              <Revelar key={item.titulo} atraso={i * 110}>
                <article className="etapa">
                  <span className="etapa-numero">{item.numero}</span>
                  <h3>{item.titulo}</h3>
                  <p>{item.texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PROPRIETARIOS ---------- */}
      <section className="secao">
        <div className="container">
          <Revelar efeito="zoom">
            <div className="chamada">
              <span className="rotulo" style={{ justifyContent: 'center' }}>
                Para proprietários
              </span>
              <TituloRevelado
                texto="Seu imóvel merece a vitrine certa"
                italico="a vitrine certa"
                className="titulo-2 titulo-centro"
              />
              <p className="texto-apoio">
                Avaliação gratuita com base em transações reais da região, fotografia profissional,
                anúncio nos principais portais e relatório mensal com o desempenho do seu imóvel.
              </p>

              <div className="chamada-acoes">
                <Link className="btn btn-ouro" href="/anuncie">
                  <IconeCasa />
                  Quero anunciar meu imóvel
                </Link>
                <a
                  className="btn btn-contorno"
                  href={linkWhatsApp('Olá! Gostaria de uma avaliação do meu imóvel.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconeWhatsApp />
                  Pedir avaliação no WhatsApp
                </a>
              </div>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ---------- NOVIDADES ---------- */}
      <section className="secao" style={{ paddingTop: 0 }}>
        <div className="container">
          <Revelar>
            <Newsletter />
          </Revelar>
        </div>
      </section>
    </>
  );
}

const DIFERENCIAIS = [
  {
    numero: '01',
    titulo: 'Curadoria antes do catálogo',
    texto:
      'Visita presencial, checagem de documentação e análise de preço frente ao histórico da região. O que não passa nesse filtro não entra na vitrine, mesmo que o proprietário insista.',
  },
  {
    numero: '02',
    titulo: 'Um consultor do início ao fim',
    texto:
      'Você não é repassado de pessoa em pessoa a cada ligação. O mesmo consultor acompanha da primeira visita à assinatura da escritura.',
  },
  {
    numero: '03',
    titulo: 'Transparência no número',
    texto:
      'Condomínio, IPTU e custo mensal aparecem na ficha antes de você perguntar. Preferimos perder uma visita a perder a confiança na reta final.',
  },
];

/**
 * Buscas prontas montadas a partir dos bairros com mais imoveis.
 *
 * Cruza os tres tipos mais comuns com os bairros mais cheios, o que
 * mostra bairro por bairro, com a contagem real de cada um. Uma lista
 * escrita a mao envelheceria: bastaria a importacao trazer um bairro
 * novo para o bloco ficar apontando para o passado.
 *
 * Antes isto cruzava bairro com tipo, pegando o i-esimo bairro e o
 * i-esimo tipo da lista. O cruzamento era arbitrario: saia "Studios em
 * Zona Rural", que nao existe, e o cartao levava a uma busca vazia. O
 * bairro sozinho e sempre verdadeiro, e e assim que a procura comeca de
 * fato — pelo lugar, e so depois pelo tipo.
 */
function montarProcurados(facetas: Facetas) {
  return facetas.bairros.slice(0, 8).map((b, i) => ({
    rotulo: b.valor,
    apoio: `${b.total} ${b.total === 1 ? 'imóvel' : 'imóveis'}`,
    href: `/imoveis?bairro=${encodeURIComponent(b.valor)}`,
    cover: `cv${(i % 6) + 1}`,
  }));
}

/**
 * Carrega do banco, ou da demonstracao, ou desiste em silencio.
 *
 * A home nao pode cair porque uma das quatro consultas falhou. Sem o
 * dado, a secao correspondente simplesmente nao aparece e o restante da
 * pagina segue no ar.
 */
async function carregar<T>(
  doBanco: () => Promise<T>,
  daDemonstracao: () => T,
  reserva: T,
): Promise<T> {
  if (semBanco()) return daDemonstracao();

  try {
    return await doBanco();
  } catch (erro) {
    console.error('[home] falha ao carregar:', erro);
    return reserva;
  }
}

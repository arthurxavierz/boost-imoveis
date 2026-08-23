import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { CHAVES_ORDEM, numero, tituloDaBusca, verboPretensao } from '@boost/core';
import type { FiltroBusca, OrdemBusca } from '@boost/core';

import { CartaoImovel } from '@/componentes/CartaoImovel';
import { FiltrosImoveis } from '@/componentes/FiltrosImoveis';
import { Ordenacao } from '@/componentes/Ordenacao';
import { Paginacao } from '@/componentes/Paginacao';
import { Revelar } from '@/componentes/Revelar';
import { IconeBusca, IconeGrade, IconeLista, IconeWhatsApp } from '@/componentes/Icones';
import { carregarBusca, carregarFacetas } from '@/lib/dados';
import { linkWhatsApp } from '@/lib/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Imóveis à venda em Uberlândia e região',
  description:
    'Apartamentos, casas em condomínio, coberturas, terrenos, fazendas e salas comerciais. ' +
    'Filtre por cidade, bairro, condomínio, valor, quartos e vagas, e fale direto com um consultor.',
  alternates: { canonical: '/imoveis' },
};

type Params = Record<string, string | string[] | undefined>;

const POR_PAGINA = 12;

export default async function PaginaImoveis({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const filtro = lerFiltro(params);
  const modo = texto(params, 'modo') === 'lista' ? 'lista' : 'grade';

  const [resultado, facetas] = await Promise.all([carregarBusca(filtro), carregarFacetas()]);

  const titulo = tituloDaBusca(filtro);

  return (
    <div className="container pagina">
      <nav className="migalhas" aria-label="Você está em">
        <Link href="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link href="/imoveis">Imóveis</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{verboPretensao(filtro.finalidade)}</span>
      </nav>

      <h1 className="titulo-2" style={{ marginTop: 18 }}>
        <span className="numerico">{numero(resultado.total)}</span> {titulo}
      </h1>

      <div className="barra-listagem">
        <p className="contagem">
          {resultado.totalPaginas > 1 && (
            <>
              Página {resultado.pagina} de {resultado.totalPaginas}
            </>
          )}
        </p>

        <div className="controles-listagem">
          {/* Os filtros e a ordenacao leem a query string, que exige um
              limite de Suspense para o Next conseguir gerar a pagina. */}
          <Suspense fallback={<div className="esqueleto" style={{ width: 120, height: 46 }} />}>
            <FiltrosImoveis
              facetas={facetas}
              filtroAtual={filtro}
              abrirAoEntrar={texto(params, 'filtros') === '1'}
            />
          </Suspense>

          <div className="seletor-modo" role="group" aria-label="Formato da lista">
            <Link
              href={montarUrl(params, { modo: null })}
              aria-current={modo === 'grade' ? 'true' : undefined}
              aria-label="Ver em grade"
            >
              <IconeGrade />
            </Link>
            <Link
              href={montarUrl(params, { modo: 'lista' })}
              aria-current={modo === 'lista' ? 'true' : undefined}
              aria-label="Ver em lista"
            >
              <IconeLista />
            </Link>
          </div>

          <Suspense fallback={null}>
            <Ordenacao atual={filtro.ordem ?? 'relevancia'} />
          </Suspense>
        </div>
      </div>

      {resultado.imoveis.length === 0 ? (
        <div className="estado-vazio">
          <IconeBusca />
          <h2 className="titulo-3">Nenhum imóvel com esses filtros</h2>
          <p>
            Tente ampliar a faixa de valor ou remover um filtro. Vale dizer: boa parte da nossa
            carteira de alto padrão é negociada com discrição e não aparece na vitrine. Se você
            procura algo específico, fale com um consultor.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginTop: 28,
              flexWrap: 'wrap',
            }}
          >
            <Link className="btn btn-contorno" href="/imoveis">
              Limpar filtros
            </Link>
            <a
              className="btn btn-zap"
              href={linkWhatsApp('Olá! Não encontrei no site o que procuro. Podem me ajudar?')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconeWhatsApp />
              Falar com um consultor
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className={modo === 'lista' ? 'lista-imoveis' : 'grade grade-4'}>
            {resultado.imoveis.map((imovel, i) => (
              <Revelar key={imovel.id} atraso={Math.min(i, 5) * 70}>
                <CartaoImovel imovel={imovel} prioridade={i < 4} />
              </Revelar>
            ))}
          </div>

          <Paginacao
            pagina={resultado.pagina}
            totalPaginas={resultado.totalPaginas}
            params={params}
          />
        </>
      )}
    </div>
  );
}

function texto(params: Params, chave: string): string | undefined {
  const v = params[chave];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

/** Monta a URL da propria pagina trocando alguns parametros. */
function montarUrl(params: Params, mudancas: Record<string, string | null>): string {
  const atuais = new URLSearchParams();

  for (const [chave, valor] of Object.entries(params)) {
    if (valor === undefined) continue;
    if (Array.isArray(valor)) for (const v of valor) atuais.append(chave, v);
    else atuais.set(chave, valor);
  }

  for (const [chave, valor] of Object.entries(mudancas)) {
    if (valor === null) atuais.delete(chave);
    else atuais.set(chave, valor);
  }

  const consulta = atuais.toString();
  return consulta ? `/imoveis?${consulta}` : '/imoveis';
}

/**
 * Traduz a query string em filtro.
 *
 * Tudo que vem da URL e texto escrito por desconhecido: numero so entra
 * se for finito e positivo, e a ordenacao so aceita um valor da lista
 * fechada. Nao e paranoia com o banco, que tem RLS: e evitar que um link
 * malformado gere uma consulta absurda de "pagina 900000".
 */
function lerFiltro(params: Params): FiltroBusca {
  const inteiro = (chave: string): number | undefined => {
    const n = Number(texto(params, chave));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  };

  const lista = (chave: string): string[] | undefined => {
    const v = params[chave];
    if (!v) return undefined;
    const itens = (Array.isArray(v) ? v : [v]).filter(Boolean);
    return itens.length ? itens : undefined;
  };

  const finalidade = texto(params, 'finalidade');
  const ordem = texto(params, 'ordem') as OrdemBusca | undefined;

  return {
    termo: texto(params, 'termo'),
    tipo: texto(params, 'tipo'),
    finalidade:
      finalidade === 'locacao' ? 'locacao' : finalidade === 'venda' ? 'venda' : undefined,
    bairro: texto(params, 'bairro'),
    cidade: texto(params, 'cidade'),
    condominio: texto(params, 'condominio'),
    quartos: inteiro('quartos'),
    suites: inteiro('suites'),
    banheiros: inteiro('banheiros'),
    vagas: inteiro('vagas'),
    valorMin: inteiro('valorMin'),
    valorMax: inteiro('valorMax'),
    areaMin: inteiro('areaMin'),
    areaMax: inteiro('areaMax'),
    caracteristicas: lista('caracteristica'),
    somenteDestaque: texto(params, 'destaque') === '1' || undefined,
    ordem: ordem && CHAVES_ORDEM.includes(ordem) ? ordem : 'relevancia',
    pagina: Math.min(inteiro('pagina') ?? 1, 500),
    porPagina: POR_PAGINA,
  };
}

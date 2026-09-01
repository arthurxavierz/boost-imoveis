import type { Metadata } from 'next';

import type { Imovel, Perfil, Proprietario } from '@boost/core';

import { ListaImoveis } from '@/componentes/imoveis/ListaImoveis';
import { imoveisDemo, nomesProprietariosDemo } from '@/lib/dados-demo';
import { equipeDemo, modoDemo } from '@/lib/demonstracao';
import { exigirPermissao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const metadata: Metadata = { title: 'Imóveis' };
export const dynamic = 'force-dynamic';

/**
 * Teto de linhas da carteira.
 *
 * Existia um teto de 500 aqui, e ele escondeu 464 imóveis de uma
 * carteira de 964 — de um jeito que ninguém tinha como perceber pela
 * tela. O mecanismo vale registrar, porque a armadilha se fecha sozinha:
 *
 * a consulta ordenava por atualizado_em desc e cortava em 500. Uma ação
 * em lote publicou os 500 que estavam visíveis, e publicar escreve
 * atualizado_em. Com isso os mesmos 500 subiram para o topo da ordenação
 * e passaram a ocupar a janela inteira para sempre. Os outros 464 nunca
 * mais apareceram — e como eram justamente os não publicados, o painel
 * dizia "461 imóveis fora da vitrine" apontando para uma tela onde
 * nenhum deles existia.
 *
 * Duas defesas contra isso voltar. O teto agora é o mesmo de
 * lib/indicadores.ts, folgado para esta imobiliária; e quando ele for
 * atingido a tela avisa, em vez de esconder o resto em silêncio.
 * Quando 2000 não bastar, o caminho é paginar no servidor — mas aí os
 * filtros desta tela, que hoje trabalham sobre a carteira inteira em
 * memória, precisam ir junto para o banco.
 */
const LIMITE_CARTEIRA = 2000;

export default async function PaginaImoveis({
  searchParams,
}: {
  searchParams: Promise<{
    imovel?: string;
    proprietario?: string;
    'sem-proprietario'?: string;
  }>;
}) {
  const params = await searchParams;
  const usuario = await exigirPermissao('imoveis');

  if (modoDemo()) {
    return (
      <ListaImoveis
        usuario={usuario}
        imoveis={imoveisDemo()}
        proprietarios={nomesProprietariosDemo()}
        equipe={equipeDemo()}
        parametros={params}
        truncada={false}
      />
    );
  }

  const supabase = await supabaseServidor();

  /**
   * Os proprietários vêm só com id e nome. A tela usa os dois para o
   * seletor de filtro e para a coluna da tabela, e não precisa de CPF
   * nem de telefone aqui — trazer o registro inteiro colocaria dado
   * sensível de dezenas de pessoas no HTML de uma tela que só queria
   * mostrar um nome.
   */
  const [imoveis, proprietarios, equipe] = await Promise.all([
    // O desempate por código não é enfeite: uma ação em lote grava o
    // mesmo atualizado_em em centenas de linhas de uma vez, e ordenar
    // só por ele deixa essas linhas empatadas. Empate no Postgres não
    // tem ordem garantida, então a mesma tela recarregada duas vezes
    // podia trazer conjuntos diferentes ao bater no teto.
    supabase
      .from('imoveis')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .order('codigo', { ascending: true })
      .limit(LIMITE_CARTEIRA),
    supabase.from('proprietarios').select('id, nome').order('nome'),
    supabase.from('perfis').select('*').eq('ativo', true).order('nome'),
  ]);

  if (imoveis.error) console.error('[imoveis] falha ao carregar:', imoveis.error);
  if (proprietarios.error) {
    console.error('[imoveis] falha ao carregar proprietários:', proprietarios.error);
  }

  const carteira = (imoveis.data ?? []) as (Imovel & { busca?: unknown })[];

  return (
    <ListaImoveis
      usuario={usuario}
      imoveis={carteira.map(semColunaDeBusca)}
      proprietarios={(proprietarios.data ?? []) as Pick<Proprietario, 'id' | 'nome'>[]}
      equipe={(equipe.data ?? []) as Perfil[]}
      parametros={params}
      truncada={carteira.length >= LIMITE_CARTEIRA}
    />
  );
}

/**
 * Tira o tsvector do registro antes de ele descer para o navegador.
 *
 * `busca` é uma coluna gerada que só existe para o índice de texto do
 * Postgres, e ninguém lê no cliente — mas ela sai no select('*') e, com
 * a carteira inteira, era o campo mais pesado da página: 453KB de um
 * payload de 2MB, quase um quarto, para um dado que nada renderiza.
 *
 * Removida aqui, e não trocando o select('*') por uma lista de colunas,
 * de propósito: a gaveta de edição monta o formulário com o registro
 * completo, e uma lista fixa de 57 nomes significaria que toda coluna
 * nova de migration nasceria faltando no formulário, em silêncio.
 */
function semColunaDeBusca(imovel: Imovel & { busca?: unknown }): Imovel {
  const { busca: _ignorado, ...resto } = imovel;
  return resto as Imovel;
}

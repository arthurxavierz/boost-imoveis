/**
 * Empreendimentos com página própria.
 *
 * Não saem do banco, e não é esquecimento: nenhum deles existe na
 * carteira importada. São lançamentos que a Boost divulga em subdomínio
 * separado, cada um com o próprio site. O cartão aqui é a porta de
 * entrada para aquele site, não para uma listagem de unidades, então
 * amarrá-los à tabela de condomínios criaria dez registros vazios só
 * para segurar um nome e uma foto.
 *
 * Para trocar a arte de um deles, basta substituir o arquivo em
 * assets/site/empreendimentos/ mantendo o mesmo nome. O `npm run assets`
 * roda antes de todo build e leva a imagem nova para o site.
 *
 * Para tirar um do ar, apague a linha. Para acrescentar, some a linha e
 * ponha a imagem na pasta. A grade só aparece no desktop e foi desenhada
 * para dez, em cinco colunas por duas linhas: mexer na quantidade pede
 * um olhar no `.grade-empreendimentos` do globals.css.
 */
export interface Empreendimento {
  nome: string;
  /** Nome do arquivo em assets/site/empreendimentos, sem a extensão. */
  arquivo: string;
  /** Site próprio do empreendimento. */
  link: string;
}

export const EMPREENDIMENTOS: Empreendimento[] = [
  { nome: 'Terruá', arquivo: 'terrua', link: 'https://terrua.boostimoveis.com.br/' },
  {
    nome: 'World Trade Center',
    arquivo: 'world-trade-center',
    link: 'https://wtc.boostimoveis.com.br/',
  },
  { nome: 'Hamoa', arquivo: 'hamoa', link: 'https://hamoa.boostimoveis.com.br/' },
  { nome: "Casa'Alta", arquivo: 'casa-alta', link: 'https://casaalta.boostimoveis.com.br/' },
  {
    nome: 'Harmon Lídice',
    arquivo: 'harmon-lidice',
    link: 'https://harmonlidice.boostimoveis.com.br/',
  },
  {
    nome: 'Tramonto, Parque Una',
    arquivo: 'tramonto-parque-una',
    link: 'https://tramonto.boostimoveis.com.br/',
  },
  {
    nome: 'Reserva do Parque',
    arquivo: 'reserva-do-parque',
    link: 'https://reserva.boostimoveis.com.br/',
  },
  { nome: 'Catuçaba', arquivo: 'catucaba', link: 'https://catucaba.boostimoveis.com.br/' },
  {
    nome: 'Park dos Cedros',
    arquivo: 'park-dos-cedros',
    link: 'https://parkdoscedros.boostimoveis.com.br/',
  },
  {
    nome: 'Buritis Club Village',
    arquivo: 'buritis-club-village',
    link: 'https://buritisclubvillage.boostimoveis.com.br/',
  },
];

/** Caminho público da arte, já sincronizada para o public/ pelo npm run assets. */
export function arteDoEmpreendimento(arquivo: string): string {
  return `/assets/site/empreendimentos/${arquivo}.jpg`;
}

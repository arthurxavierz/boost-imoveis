/**
 * Lançamentos divulgados na home.
 *
 * Não saem do banco, e não é esquecimento: nenhum deles existe na
 * carteira importada. São lançamentos que a Boost divulga à parte, e
 * amarrá-los à tabela de condomínios criaria dez registros vazios só
 * para segurar um nome e uma foto.
 *
 * Todos os cartões levam ao contato, e não ao site de cada lançamento.
 * A decisão é de quem vende: em lançamento a conversa começa com o
 * consultor, e mandar a pessoa para fora do site no meio da visita
 * entrega a intenção para outro lugar. O endereço de cada um fica
 * guardado abaixo, em `site`, para o dia em que a decisão mudar.
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
  /**
   * Site próprio do lançamento. Registro, não destino: hoje o cartão
   * aponta para DESTINO_EMPREENDIMENTO.
   */
  site: string;
}

/** Para onde todo cartão de lançamento leva. */
export const DESTINO_EMPREENDIMENTO = '/contato';

export const EMPREENDIMENTOS: Empreendimento[] = [
  { nome: 'Terruá', arquivo: 'terrua', site: 'https://terrua.boostimoveis.com.br/' },
  {
    nome: 'World Trade Center',
    arquivo: 'world-trade-center',
    site: 'https://wtc.boostimoveis.com.br/',
  },
  { nome: 'Hamoa', arquivo: 'hamoa', site: 'https://hamoa.boostimoveis.com.br/' },
  { nome: "Casa'Alta", arquivo: 'casa-alta', site: 'https://casaalta.boostimoveis.com.br/' },
  {
    nome: 'Harmon Lídice',
    arquivo: 'harmon-lidice',
    site: 'https://harmonlidice.boostimoveis.com.br/',
  },
  {
    nome: 'Tramonto, Parque Una',
    arquivo: 'tramonto-parque-una',
    site: 'https://tramonto.boostimoveis.com.br/',
  },
  {
    nome: 'Reserva do Parque',
    arquivo: 'reserva-do-parque',
    site: 'https://reserva.boostimoveis.com.br/',
  },
  { nome: 'Catuçaba', arquivo: 'catucaba', site: 'https://catucaba.boostimoveis.com.br/' },
  {
    nome: 'Park dos Cedros',
    arquivo: 'park-dos-cedros',
    site: 'https://parkdoscedros.boostimoveis.com.br/',
  },
  {
    nome: 'Buritis Club Village',
    arquivo: 'buritis-club-village',
    site: 'https://buritisclubvillage.boostimoveis.com.br/',
  },
];

/** Caminho público da arte, já sincronizada para o public/ pelo npm run assets. */
export function arteDoEmpreendimento(arquivo: string): string {
  return `/assets/site/empreendimentos/${arquivo}.jpg`;
}

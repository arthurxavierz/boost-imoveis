import Link from 'next/link';

import { SITE } from '../lib/site';

/**
 * A marca da Boost.
 *
 * O simbolo entra como <img> de um SVG, e nao inline no JSX, por um
 * motivo de peso: ele aparece no cabecalho e no rodape de toda pagina
 * do site, e inline seria o mesmo desenho repetido dentro de cada HTML
 * que o servidor manda. Como arquivo, o navegador baixa uma vez e
 * reaproveita no resto da navegacao.
 *
 * O preco disso e que <img> nao herda currentColor. Por isso a cor vem
 * de uma mascara CSS em .marca-selo: o SVG vira recorte, e quem pinta e
 * o background. Assim o mesmo arquivo sai ouro no cabecalho e branco em
 * fundo claro, sem duplicar arquivo.
 */
export function Marca({ href = '/', rotulo }: { href?: string; rotulo?: string }) {
  return (
    <Link href={href} className="marca" aria-label={rotulo ?? SITE.nome}>
      <span className="marca-selo" aria-hidden="true" />
      <span className="marca-texto">
        <span className="marca-nome">{SITE.nomeCurto}</span>
        <span className="marca-sub">Negócios Imobiliários</span>
      </span>
    </Link>
  );
}

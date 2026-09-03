import Image from 'next/image';

import { EMPREENDIMENTOS, arteDoEmpreendimento } from '@/lib/empreendimentos';

import { IconeSeta } from './Icones';

/**
 * Grade dos empreendimentos com site próprio.
 *
 * Só no desktop, por decisão de quem pediu: no celular a grade viria
 * depois do hero e antes de qualquer imóvel, empurrando a vitrine para
 * baixo do terceiro rolar. O CSS esconde tudo abaixo de 1200px, e a
 * marcação continua no HTML para o Google seguir os dez links.
 *
 * Sem componente de cliente e sem JavaScript. A entrada escalonada é
 * uma animação de CSS com atraso por índice, e o realce no hover é
 * seletor puro. Isso não é economia de linha: a seção equivalente que
 * dependia do observador de interseção ficou invisível em parte das
 * máquinas, e aqui não há nada que possa deixar de acontecer.
 */
export function GradeEmpreendimentos() {
  if (EMPREENDIMENTOS.length === 0) return null;

  return (
    <div className="grade-empreendimentos">
      {EMPREENDIMENTOS.map((item, i) => (
        <a
          key={item.arquivo}
          className="empreendimento"
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          // O atraso vem do índice: são dez elementos fixos, e uma
          // variável por item evita dez regras nth-child no CSS.
          style={{ '--ordem': i } as React.CSSProperties}
        >
          <Image
            src={arteDoEmpreendimento(item.arquivo)}
            alt={item.nome}
            fill
            sizes="(max-width: 1200px) 0px, 20vw"
            style={{ objectFit: 'cover' }}
          />

          <span className="empreendimento-veu" aria-hidden="true" />

          <span className="empreendimento-nome">
            {item.nome}
            <IconeSeta />
          </span>
        </a>
      ))}
    </div>
  );
}

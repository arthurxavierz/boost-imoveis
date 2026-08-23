'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import type { ImovelPublico } from '@boost/core';
import { urlFoto } from '@boost/db';

import { IconeFechar, IconeImagem, IconeSeta, IconeSetaEsquerda } from './Icones';

/**
 * Galeria do imovel.
 *
 * Mosaico de quatro fotos que abre um visor de tela cheia ao clique. O
 * visor e a parte que importa: numa vitrine de alto padrao a foto e o
 * argumento de venda, e ver uma miniatura de trezentos pixels nao decide
 * ninguem.
 *
 * Navegacao por seta do teclado e por gesto de arrastar, porque metade
 * das visitas vem do celular e ali ninguem procura botao.
 */
export function GaleriaImovel({ imovel }: { imovel: ImovelPublico }) {
  const fotos = (imovel.fotos ?? [])
    .map((f) => ({ url: urlFoto(f.path), legenda: f.legenda }))
    .filter((f): f is { url: string; legenda: string | null } => Boolean(f.url));

  const [visor, setVisor] = useState(false);
  const [atual, setAtual] = useState(0);
  const [toqueX, setToqueX] = useState<number | null>(null);

  const total = fotos.length;

  const andar = useCallback(
    (passo: number) => {
      if (total === 0) return;
      setAtual((i) => (i + passo + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (!visor) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setVisor(false);
      if (e.key === 'ArrowRight') andar(1);
      if (e.key === 'ArrowLeft') andar(-1);
    }

    document.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [visor, andar]);

  function abrir(indice: number) {
    if (total === 0) return;
    setAtual(indice);
    setVisor(true);
  }

  const principal = fotos[0];
  const secundarias = fotos.slice(1, 4);

  return (
    <>
      <div className="galeria">
        <div
          className="galeria-item galeria-principal"
          onClick={() => abrir(0)}
          role={total > 0 ? 'button' : undefined}
          tabIndex={total > 0 ? 0 : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              abrir(0);
            }
          }}
          aria-label={total > 0 ? `Ver as ${total} fotos de ${imovel.titulo}` : undefined}
        >
          {principal ? (
            <Image
              src={principal.url}
              alt={principal.legenda ?? imovel.titulo}
              fill
              sizes="(max-width: 900px) 100vw, 66vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div className="galeria-vazia" aria-hidden="true">
              B
            </div>
          )}
        </div>

        {[0, 1, 2].map((i) => {
          const foto = secundarias[i];
          const ehUltima = i === 2 && total > 4;

          return (
            <div
              key={i}
              className={`galeria-item${i === 0 ? ' galeria-secundaria-movel' : ''}`}
              onClick={() => abrir(Math.min(i + 1, total - 1))}
              role={foto ? 'button' : undefined}
              tabIndex={foto ? 0 : undefined}
              aria-label={foto ? `Abrir foto ${i + 2}` : undefined}
            >
              {foto ? (
                <>
                  <Image
                    src={foto.url}
                    alt={foto.legenda ?? `${imovel.titulo}, foto ${i + 2}`}
                    fill
                    sizes="33vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {ehUltima && <span className="galeria-mais">mais {total - 4} fotos</span>}
                </>
              ) : (
                <div className="galeria-vazia" style={{ fontSize: '2rem' }} aria-hidden="true">
                  <IconeImagem style={{ width: 30, height: 30 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visor && total > 0 && (
        <div className="visor" role="dialog" aria-modal="true" aria-label="Fotos do imóvel">
          <header className="visor-topo">
            <span>
              {atual + 1} de {total}
            </span>
            <span>{fotos[atual].legenda ?? imovel.titulo}</span>
            <button className="btn-icone" onClick={() => setVisor(false)} aria-label="Fechar fotos">
              <IconeFechar />
            </button>
          </header>

          <div
            className="visor-palco"
            onTouchStart={(e) => setToqueX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (toqueX === null) return;
              const distancia = e.changedTouches[0].clientX - toqueX;
              // Quarenta pixels separa um arrastar de um toque trêmulo.
              if (Math.abs(distancia) > 40) andar(distancia > 0 ? -1 : 1);
              setToqueX(null);
            }}
          >
            {total > 1 && (
              <button
                className="visor-nav"
                data-lado="esquerda"
                onClick={() => andar(-1)}
                aria-label="Foto anterior"
              >
                <IconeSetaEsquerda />
              </button>
            )}

            <Image
              src={fotos[atual].url}
              alt={fotos[atual].legenda ?? `${imovel.titulo}, foto ${atual + 1}`}
              width={1600}
              height={1067}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
              priority
            />

            {total > 1 && (
              <button
                className="visor-nav"
                data-lado="direita"
                onClick={() => andar(1)}
                aria-label="Próxima foto"
              >
                <IconeSeta />
              </button>
            )}
          </div>

          {total > 1 && (
            <div className="visor-tiras">
              {fotos.map((f, i) => (
                <button
                  key={f.url}
                  className="visor-tira"
                  aria-current={i === atual}
                  onClick={() => setAtual(i)}
                  aria-label={`Ir para a foto ${i + 1}`}
                >
                  <Image
                    src={f.url}
                    alt=""
                    width={192}
                    height={132}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

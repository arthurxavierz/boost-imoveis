import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FormularioEntrada } from '@/componentes/FormularioEntrada';

export const metadata: Metadata = { title: 'Entrar' };

export default function PaginaEntrar() {
  return (
    <div className="entrada">
      <aside className="entrada-arte">
        <div className="linha-flex">
          <span className="selo" aria-hidden="true" />
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Boost
            </strong>
            <span
              style={{
                display: 'block',
                fontSize: '0.6rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.45)',
                marginTop: 3,
              }}
            >
              Negócios Imobiliários
            </span>
          </div>
        </div>

        <p className="entrada-frase">
          Sua carteira, seu funil e sua <em>comissão</em>, no mesmo lugar.
        </p>

        <p className="entrada-nota">
          Cada consultor enxerga a própria carteira. A gestão enxerga o conjunto. Nenhum dado de
          cliente sai daqui sem passar pelas regras de permissão do sistema.
        </p>
      </aside>

      <main className="entrada-painel">
        <Suspense fallback={<div className="esqueleto" style={{ height: 380, width: 384 }} />}>
          <FormularioEntrada />
        </Suspense>
      </main>
    </div>
  );
}

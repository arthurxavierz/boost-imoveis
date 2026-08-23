'use client';

import { useMemo, useTransition } from 'react';

import {
  brl,
  data as fmtData,
  type Perfil,
  type VendaDetalhada,
  type VendaParcela,
} from '@boost/core';

import { baixarParcela } from '@/app/(painel)/financeiro/acoes';
import { IconeCheck, IconeVazio } from '@/componentes/Icones';

/**
 * Recebiveis: o que a imobiliaria tem a receber e quando.
 *
 * Comissao raramente entra de uma vez. O padrao e sinal na assinatura e
 * saldo na liberacao do financiamento, que pode levar 60 dias. Sem
 * controlar parcela a parcela, o caixa nunca sabe o que ja caiu de fato,
 * e o mes fecha com um numero que nao existe na conta.
 */
export function Parcelas({
  parcelas,
  vendas,
  equipe,
  aoAtualizar,
}: {
  parcelas: VendaParcela[];
  vendas: VendaDetalhada[];
  equipe: Perfil[];
  aoAtualizar: (mensagem: string, erro?: boolean) => void;
}) {
  const [pendente, iniciar] = useTransition();

  const porVenda = useMemo(() => new Map(vendas.map((v) => [v.id, v])), [vendas]);
  const porPessoa = useMemo(() => new Map(equipe.map((p) => [p.id, p.nome])), [equipe]);

  const hoje = new Date().toISOString().slice(0, 10);

  const { vencidas, aVencer, pagas, totalPendente, totalVencido } = useMemo(() => {
    const vencidas: VendaParcela[] = [];
    const aVencer: VendaParcela[] = [];
    const pagas: VendaParcela[] = [];

    for (const p of parcelas) {
      if (p.status === 'pago') pagas.push(p);
      else if (p.status === 'cancelado') continue;
      else if (p.vencimento < hoje) vencidas.push(p);
      else aVencer.push(p);
    }

    return {
      vencidas,
      aVencer,
      pagas,
      totalPendente: [...vencidas, ...aVencer].reduce((s, p) => s + Number(p.valor), 0),
      totalVencido: vencidas.reduce((s, p) => s + Number(p.valor), 0),
    };
  }, [parcelas, hoje]);

  function alternar(parcela: VendaParcela) {
    iniciar(async () => {
      const r = await baixarParcela(parcela.id, parcela.status !== 'pago');
      aoAtualizar(r.ok ? (r.mensagem ?? 'Atualizado.') : (r.erro ?? 'Falha.'), !r.ok);
    });
  }

  if (parcelas.length === 0) {
    return (
      <div className="vazio">
        <IconeVazio />
        <h3>Nenhuma parcela lançada</h3>
        <p>
          Ao registrar um negócio, o sistema sugere as parcelas da comissão conforme a forma de
          pagamento. Elas aparecem aqui para receber baixa quando o dinheiro entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="grade-cartoes">
      {vencidas.length > 0 && (
        <Bloco
          titulo="Vencidas"
          descricao={`${brl(totalVencido)} com o prazo já passado`}
          cor="rubro"
          parcelas={vencidas}
          porVenda={porVenda}
          porPessoa={porPessoa}
          pendente={pendente}
          aoAlternar={alternar}
        />
      )}

      <Bloco
        titulo="A vencer"
        descricao={`${brl(totalPendente)} previstos no total`}
        parcelas={aVencer}
        porVenda={porVenda}
        porPessoa={porPessoa}
        pendente={pendente}
        aoAlternar={alternar}
      />

      {pagas.length > 0 && (
        <Bloco
          titulo="Recebidas"
          descricao={`${brl(pagas.reduce((s, p) => s + Number(p.valor), 0))} já em caixa`}
          cor="verde"
          parcelas={pagas}
          porVenda={porVenda}
          porPessoa={porPessoa}
          pendente={pendente}
          aoAlternar={alternar}
        />
      )}
    </div>
  );
}

function Bloco({
  titulo,
  descricao,
  cor,
  parcelas,
  porVenda,
  porPessoa,
  pendente,
  aoAlternar,
}: {
  titulo: string;
  descricao: string;
  cor?: 'rubro' | 'verde';
  parcelas: VendaParcela[];
  porVenda: Map<string, VendaDetalhada>;
  porPessoa: Map<string, string>;
  pendente: boolean;
  aoAlternar: (p: VendaParcela) => void;
}) {
  if (parcelas.length === 0) {
    return (
      <div className="cartao">
        <div className="cartao-cabecalho">
          <h3>{titulo}</h3>
        </div>
        <div className="cartao-corpo">
          <p className="texto-mudo">Nada nesta situação.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cartao">
      <div className="cartao-cabecalho">
        <div>
          <h3>{titulo}</h3>
          <p className="texto-mudo">{descricao}</p>
        </div>
        <span className={`etiqueta${cor ? ` etiqueta-${cor}` : ''}`}>{parcelas.length}</span>
      </div>

      <div className="tabela-envelope">
        <table className="tabela tabela-responsiva">
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Negócio</th>
              <th>Destino</th>
              <th className="numerico">Valor</th>
              <th className="numerico">Vencimento</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {parcelas.map((p) => {
              const venda = porVenda.get(p.venda_id);
              const paga = p.status === 'pago';

              return (
                <tr key={p.id}>
                  <td data-rotulo="Parcela" className="celula-principal">
                    {p.descricao}
                  </td>
                  <td data-rotulo="Negócio">
                    {venda ? (
                      <>
                        {venda.codigo}
                        <span className="celula-apoio">{venda.imovel_titulo}</span>
                      </>
                    ) : (
                      <span className="texto-mudo">Negócio removido</span>
                    )}
                  </td>
                  <td data-rotulo="Destino">
                    {p.destino === 'casa'
                      ? 'Imobiliária'
                      : (p.beneficiario_id && porPessoa.get(p.beneficiario_id)) || p.destino}
                  </td>
                  <td data-rotulo="Valor" className="numerico">
                    {brl(p.valor)}
                  </td>
                  <td data-rotulo="Vencimento" className="numerico">
                    {fmtData(p.vencimento)}
                    {paga && p.pago_em && (
                      <span className="celula-apoio">pago em {fmtData(p.pago_em)}</span>
                    )}
                  </td>
                  <td data-rotulo="">
                    <button
                      className={paga ? 'btn btn-fantasma btn-pequeno' : 'btn btn-pequeno'}
                      onClick={() => aoAlternar(p)}
                      disabled={pendente}
                    >
                      {paga ? (
                        'Desfazer baixa'
                      ) : (
                        <>
                          <IconeCheck />
                          Dar baixa
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

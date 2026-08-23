'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  area as fmtArea,
  brl,
  data as fmtData,
  ehRural,
  podeGerenciarImovel,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  type Imovel,
  type Perfil,
  type Proprietario,
} from '@boost/core';

import {
  excluirImovel,
  salvarImovel,
  type EstadoAcao,
} from '@/app/(painel)/imoveis/acoes';
import { IconeAlerta, IconeFechar, IconeLapis, IconeLixeira, IconeMais } from '@/componentes/Icones';

const ESTADO_INICIAL: EstadoAcao = { ok: false };

type Aba = 'ficha' | 'captacao';

/**
 * Ficha do imóvel.
 *
 * O formulário é longo — imóvel tem muitos campos, e não há como fugir
 * disso. O que dá para fazer é separar o que a vitrine mostra do que
 * só a casa vê, e é o que as duas abas fazem: "Ficha" é o anúncio,
 * "Captação" é o contrato. Quem cadastra um imóvel novo preenche a
 * primeira; quem vai negociar abre a segunda.
 *
 * O proprietário fica na aba de captação, mas é exigido no envio das
 * duas. Por isso o aviso aparece no rodapé, visível de qualquer aba:
 * um campo obrigatório escondido atrás de uma aba que a pessoa não
 * abriu é a receita de um formulário que recusa sem explicar por quê.
 */
export function GavetaImovel({
  usuario,
  imovel,
  proprietarios,
  equipe,
  aoFechar,
  aoConcluir,
  aoPedirProprietario,
}: {
  usuario: Perfil;
  imovel: Imovel | null;
  proprietarios: Pick<Proprietario, 'id' | 'nome'>[];
  equipe: Perfil[];
  aoFechar: () => void;
  aoConcluir: (mensagem: string, erro?: boolean) => void;
  /** Abre o cadastro de proprietário sem perder o que já foi digitado. */
  aoPedirProprietario: () => void;
}) {
  const [estado, setEstado] = useState<EstadoAcao>(ESTADO_INICIAL);
  const [enviando, iniciarEnvio] = useTransition();
  const [pendente, iniciar] = useTransition();

  const novo = !imovel;
  const [aba, setAba] = useState<Aba>('ficha');
  const [editando, setEditando] = useState(novo);
  const [finalidade, setFinalidade] = useState(imovel?.finalidade ?? 'venda');
  const [tipo, setTipo] = useState(imovel?.tipo ?? 'Apartamento');
  const [proprietarioId, setProprietarioId] = useState(imovel?.proprietario_id ?? '');

  const gestor = usuario.papel === 'admin' || usuario.papel === 'gestor';
  const editavel = novo || podeGerenciarImovel(usuario, imovel!);
  const rural = ehRural(tipo);

  /**
   * O envio passa por aqui em vez de ir direto no `action` do <form>.
   *
   * Não é preferência de estilo: o React 19 limpa o formulário assim
   * que a ação termina, inclusive quando ela termina em erro. Numa
   * ficha deste tamanho isso significa perder trinta campos digitados
   * porque faltava um — o comportamento mais frustrante que um
   * cadastro pode ter, e o mais fácil de não notar em teste manual,
   * porque só aparece quando a validação recusa.
   *
   * Chamando a ação dentro de uma transição, nada é limpo. A
   * validação nativa do navegador continua valendo: onSubmit só
   * dispara depois que os `required` passaram.
   */
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);

    iniciarEnvio(async () => {
      const r = await salvarImovel(ESTADO_INICIAL, dados);
      setEstado(r);
      if (r.ok && r.mensagem) aoConcluir(r.mensagem);
    });
  }

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [aoFechar]);

  function remover() {
    if (!imovel) return;

    const certeza = window.confirm(
      `Excluir ${imovel.titulo} em definitivo?\n\nO histórico de visitas vai junto e não há como desfazer.\n\nPara apenas tirar do site sem perder o registro, cancele e mude a situação para "Inativo".`,
    );
    if (!certeza) return;

    iniciar(async () => {
      const r = await excluirImovel(imovel.id);
      aoConcluir(r.ok ? (r.mensagem ?? 'Excluído.') : (r.erro ?? 'Falha.'), !r.ok);
    });
  }

  const somenteLeitura = !editando && !novo;

  return (
    <>
      <div className="fundo-escuro" onClick={aoFechar} aria-hidden="true" />

      <div className="gaveta gaveta-larga" role="dialog" aria-modal="true" aria-label="Imóvel">
        <header className="gaveta-topo">
          <div style={{ minWidth: 0 }}>
            <h2>{imovel ? imovel.titulo : 'Novo imóvel'}</h2>
            <p>
              {imovel
                ? `${imovel.codigo} · ${imovel.tipo}${
                    imovel.bairro ? ` · ${imovel.bairro}` : ''
                  } · atualizado em ${fmtData(imovel.atualizado_em)}`
                : 'Cadastro de captação. Entra fora do ar, e vai para a vitrine quando você publicar.'}
            </p>
          </div>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <IconeFechar />
          </button>
        </header>

        {imovel && !editando && (
          <div className="gaveta-atalhos">
            <span className={`etiqueta etiqueta-${STATUS_IMOVEL[imovel.status].cor}`}>
              {STATUS_IMOVEL[imovel.status].rotulo}
            </span>
            <span className="etiqueta">{imovel.publicado ? 'No ar' : 'Fora do ar'}</span>
            {!imovel.proprietario_id && (
              <span className="marca-pendencia">
                <IconeAlerta />
                Sem proprietário
              </span>
            )}
            {editavel && (
              <button
                className="btn btn-claro btn-pequeno empurra"
                onClick={() => setEditando(true)}
              >
                <IconeLapis />
                Editar
              </button>
            )}
          </div>
        )}

        <div className="abas" role="tablist">
          <button role="tab" aria-selected={aba === 'ficha'} onClick={() => setAba('ficha')}>
            Ficha do anúncio
          </button>
          <button role="tab" aria-selected={aba === 'captacao'} onClick={() => setAba('captacao')}>
            Captação
            {!proprietarioId && <span className="aba-contador">!</span>}
          </button>
        </div>

        <form onSubmit={enviar} style={{ display: 'contents' }}>
          <input type="hidden" name="id" value={imovel?.id ?? ''} />
          {/* O select do proprietário vive na aba de captação. Quando a
              pessoa envia estando na aba da ficha, o campo continua no
              DOM (as abas escondem por CSS, não desmontam), então o
              valor viaja junto. */}

          <div className="gaveta-corpo">
            <div hidden={aba !== 'ficha'}>
              <div className="formulario">
                <div className="campo">
                  <label htmlFor="titulo">
                    Título do anúncio<span className="obrigatorio">*</span>
                  </label>
                  <input
                    id="titulo"
                    name="titulo"
                    defaultValue={imovel?.titulo ?? ''}
                    maxLength={160}
                    required
                    disabled={somenteLeitura}
                    autoFocus={novo}
                    placeholder="Cobertura Duplex Morada da Colina"
                  />
                  <span className="ajuda">
                    É o que aparece no cartão da vitrine e no resultado do Google. Tipo, diferencial
                    e bairro, nessa ordem, funcionam melhor que adjetivo.
                  </span>
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="tipo">Tipo</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      disabled={somenteLeitura}
                    >
                      {TIPOS_IMOVEL.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo">
                    <label htmlFor="finalidade">Finalidade</label>
                    <select
                      id="finalidade"
                      name="finalidade"
                      value={finalidade}
                      onChange={(e) => setFinalidade(e.target.value as typeof finalidade)}
                      disabled={somenteLeitura}
                    >
                      <option value="venda">Venda</option>
                      <option value="locacao">Locação</option>
                      <option value="venda_locacao">Venda e locação</option>
                    </select>
                  </div>

                  <div className="campo">
                    <label htmlFor="status">Situação</label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={imovel?.status ?? 'disponivel'}
                      disabled={somenteLeitura}
                    >
                      {Object.entries(STATUS_IMOVEL).map(([chave, info]) => (
                        <option key={chave} value={chave}>
                          {info.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="linha-campos">
                  {finalidade !== 'locacao' && (
                    <div className="campo">
                      <label htmlFor="valor">
                        Valor de venda<span className="obrigatorio">*</span>
                      </label>
                      <div className="campo-prefixado">
                        <span>R$</span>
                        <input
                          id="valor"
                          name="valor"
                          inputMode="decimal"
                          defaultValue={imovel?.valor ? String(imovel.valor) : ''}
                          disabled={somenteLeitura}
                          placeholder="2.850.000"
                        />
                      </div>
                    </div>
                  )}

                  {finalidade !== 'venda' && (
                    <div className="campo">
                      <label htmlFor="valor_locacao">
                        Aluguel mensal<span className="obrigatorio">*</span>
                      </label>
                      <div className="campo-prefixado">
                        <span>R$</span>
                        <input
                          id="valor_locacao"
                          name="valor_locacao"
                          inputMode="decimal"
                          defaultValue={imovel?.valor_locacao ? String(imovel.valor_locacao) : ''}
                          disabled={somenteLeitura}
                          placeholder="6.500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="valor_condominio">Condomínio</label>
                    <div className="campo-prefixado">
                      <span>R$</span>
                      <input
                        id="valor_condominio"
                        name="valor_condominio"
                        inputMode="decimal"
                        defaultValue={
                          imovel?.valor_condominio ? String(imovel.valor_condominio) : ''
                        }
                        disabled={somenteLeitura}
                      />
                    </div>
                  </div>

                  <div className="campo">
                    <label htmlFor="valor_iptu">IPTU mensal</label>
                    <div className="campo-prefixado">
                      <span>R$</span>
                      <input
                        id="valor_iptu"
                        name="valor_iptu"
                        inputMode="decimal"
                        defaultValue={imovel?.valor_iptu ? String(imovel.valor_iptu) : ''}
                        disabled={somenteLeitura}
                      />
                    </div>
                  </div>
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="area_util">Área útil (m²)</label>
                    <input
                      id="area_util"
                      name="area_util"
                      inputMode="decimal"
                      defaultValue={imovel?.area_util ? String(imovel.area_util) : ''}
                      disabled={somenteLeitura}
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="area_total">Área total (m²)</label>
                    <input
                      id="area_total"
                      name="area_total"
                      inputMode="decimal"
                      defaultValue={imovel?.area_total ? String(imovel.area_total) : ''}
                      disabled={somenteLeitura}
                    />
                  </div>

                  {rural && (
                    <div className="campo">
                      <label htmlFor="hectares">Hectares</label>
                      <input
                        id="hectares"
                        name="hectares"
                        inputMode="decimal"
                        defaultValue={imovel?.hectares ? String(imovel.hectares) : ''}
                        disabled={somenteLeitura}
                      />
                      <span className="ajuda">Área rural se negocia em hectare, não em m².</span>
                    </div>
                  )}
                </div>

                <div className="linha-campos">
                  {(['quartos', 'suites', 'banheiros', 'vagas'] as const).map((campo) => (
                    <div className="campo" key={campo}>
                      <label htmlFor={campo} style={{ textTransform: 'capitalize' }}>
                        {campo === 'suites' ? 'Suítes' : campo}
                      </label>
                      <input
                        id={campo}
                        name={campo}
                        inputMode="numeric"
                        defaultValue={imovel ? String(imovel[campo]) : '0'}
                        disabled={somenteLeitura}
                      />
                    </div>
                  ))}
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="bairro">Bairro</label>
                    <input
                      id="bairro"
                      name="bairro"
                      defaultValue={imovel?.bairro ?? ''}
                      disabled={somenteLeitura}
                      placeholder="Jardim Karaíba"
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="cidade">Cidade</label>
                    <input
                      id="cidade"
                      name="cidade"
                      defaultValue={imovel?.cidade ?? 'Uberlândia'}
                      disabled={somenteLeitura}
                    />
                  </div>

                  <div className="campo" style={{ maxWidth: 90 }}>
                    <label htmlFor="uf">UF</label>
                    <input
                      id="uf"
                      name="uf"
                      defaultValue={imovel?.uf ?? 'MG'}
                      maxLength={2}
                      disabled={somenteLeitura}
                    />
                  </div>
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="logradouro">Logradouro</label>
                    <input
                      id="logradouro"
                      name="logradouro"
                      defaultValue={imovel?.logradouro ?? ''}
                      disabled={somenteLeitura}
                    />
                  </div>

                  <div className="campo" style={{ maxWidth: 120 }}>
                    <label htmlFor="numero">Número</label>
                    <input
                      id="numero"
                      name="numero"
                      defaultValue={imovel?.numero ?? ''}
                      disabled={somenteLeitura}
                    />
                  </div>

                  <div className="campo" style={{ maxWidth: 150 }}>
                    <label htmlFor="cep">CEP</label>
                    <input
                      id="cep"
                      name="cep"
                      inputMode="numeric"
                      defaultValue={imovel?.cep ?? ''}
                      disabled={somenteLeitura}
                    />
                  </div>
                </div>

                <label className="caixa-marcavel">
                  <input
                    type="checkbox"
                    name="exibir_endereco"
                    defaultChecked={imovel?.exibir_endereco ?? false}
                    disabled={somenteLeitura}
                  />
                  <span>
                    Mostrar o endereço completo no site
                    <span className="ajuda">
                      Desligado, a vitrine exibe apenas bairro e cidade. É o padrão no alto padrão,
                      onde o proprietário costuma pedir sigilo.
                    </span>
                  </span>
                </label>

                <div className="campo">
                  <label htmlFor="descricao">Descrição</label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    defaultValue={imovel?.descricao ?? ''}
                    rows={6}
                    maxLength={6000}
                    disabled={somenteLeitura}
                    placeholder="O que a foto não mostra: reforma recente, orientação solar, o que fica a pé de distância."
                  />
                </div>

                <div className="campo">
                  <label htmlFor="caracteristicas">Características</label>
                  <textarea
                    id="caracteristicas"
                    name="caracteristicas"
                    defaultValue={(imovel?.caracteristicas ?? []).join('\n')}
                    rows={4}
                    disabled={somenteLeitura}
                    placeholder={'Piscina privativa\nEspaço gourmet\nPortaria 24h'}
                  />
                  <span className="ajuda">Uma por linha. Viram as etiquetas da página do imóvel.</span>
                </div>

                <div className="linha-flex" style={{ gap: 18 }}>
                  <label className="caixa-marcavel">
                    <input
                      type="checkbox"
                      name="aceita_financiamento"
                      defaultChecked={imovel?.aceita_financiamento ?? true}
                      disabled={somenteLeitura}
                    />
                    <span>Aceita financiamento</span>
                  </label>

                  <label className="caixa-marcavel">
                    <input
                      type="checkbox"
                      name="aceita_permuta"
                      defaultChecked={imovel?.aceita_permuta ?? false}
                      disabled={somenteLeitura}
                    />
                    <span>Aceita permuta</span>
                  </label>

                  <label className="caixa-marcavel">
                    <input
                      type="checkbox"
                      name="mobiliado"
                      defaultChecked={imovel?.mobiliado ?? false}
                      disabled={somenteLeitura}
                    />
                    <span>Mobiliado</span>
                  </label>
                </div>
              </div>
            </div>

            <div hidden={aba !== 'captacao'}>
              <div className="formulario">
                <div className="campo">
                  <label htmlFor="proprietario_id">
                    Proprietário<span className="obrigatorio">*</span>
                  </label>
                  <div className="linha-flex" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <select
                      id="proprietario_id"
                      name="proprietario_id"
                      value={proprietarioId}
                      onChange={(e) => setProprietarioId(e.target.value)}
                      disabled={somenteLeitura}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">Selecione quem entregou o imóvel</option>
                      {proprietarios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>

                    {!somenteLeitura && (
                      <button
                        type="button"
                        className="btn btn-claro"
                        onClick={aoPedirProprietario}
                        title="Cadastrar um proprietário novo"
                      >
                        <IconeMais />
                        Novo
                      </button>
                    )}
                  </div>
                  <span className="ajuda">
                    Obrigatório. Sem proprietário vinculado não há quem autorize a visita, quem
                    assine a proposta, nem de onde sair a comissão. Se a pessoa ainda não está no
                    cadastro, use o botão ao lado — o que você já preencheu aqui não se perde.
                  </span>
                </div>

                {gestor && (
                  <div className="campo">
                    <label htmlFor="corretor_id">Consultor responsável</label>
                    <select
                      id="corretor_id"
                      name="corretor_id"
                      defaultValue={imovel?.corretor_id ?? ''}
                      disabled={somenteLeitura}
                    >
                      <option value="">Sem responsável</option>
                      {equipe
                        .filter((p) => p.ativo)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                            {p.id === usuario.id ? ' (você)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="matricula">Matrícula</label>
                    <input
                      id="matricula"
                      name="matricula"
                      defaultValue={imovel?.matricula ?? ''}
                      disabled={somenteLeitura}
                      placeholder="MAT-00000"
                    />
                    <span className="ajuda">Nunca aparece no site.</span>
                  </div>

                  <div className="campo">
                    <label htmlFor="autorizacao_ate">Autorização até</label>
                    <input
                      id="autorizacao_ate"
                      name="autorizacao_ate"
                      type="date"
                      defaultValue={imovel?.autorizacao_ate ?? ''}
                      disabled={somenteLeitura}
                    />
                  </div>
                </div>

                <div className="linha-campos">
                  <div className="campo">
                    <label htmlFor="ano_construcao">Ano de construção</label>
                    <input
                      id="ano_construcao"
                      name="ano_construcao"
                      inputMode="numeric"
                      defaultValue={imovel?.ano_construcao ? String(imovel.ano_construcao) : ''}
                      disabled={somenteLeitura}
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="andar">Andar</label>
                    <input
                      id="andar"
                      name="andar"
                      inputMode="numeric"
                      defaultValue={imovel?.andar ? String(imovel.andar) : ''}
                      disabled={somenteLeitura}
                    />
                  </div>
                </div>

                <label className="caixa-marcavel">
                  <input
                    type="checkbox"
                    name="exclusividade"
                    defaultChecked={imovel?.exclusividade ?? false}
                    disabled={somenteLeitura}
                  />
                  <span>Captação com exclusividade</span>
                </label>

                <div className="campo">
                  <label htmlFor="observacoes_internas">Observações internas</label>
                  <textarea
                    id="observacoes_internas"
                    name="observacoes_internas"
                    defaultValue={imovel?.observacoes_internas ?? ''}
                    rows={4}
                    maxLength={3000}
                    disabled={somenteLeitura}
                    placeholder="Piso de negociação, pendência de documentação, o que não pode ser divulgado."
                  />
                  <span className="ajuda">
                    Fica só no painel. A view da vitrine não alcança este campo, então não há como
                    ele escapar para o site por descuido.
                  </span>
                </div>

                {imovel && (
                  <div className="ficha-resumo ficha-resumo-largo">
                    <FichaItem rotulo="Código" valor={imovel.codigo} />
                    <FichaItem
                      rotulo="Origem"
                      valor={imovel.fonte === 'manual' ? 'Cadastro manual' : 'Importação de XML'}
                    />
                    <FichaItem rotulo="Visualizações" valor={String(imovel.visualizacoes)} />
                    <FichaItem rotulo="Área útil" valor={fmtArea(imovel.area_util)} />
                    <FichaItem rotulo="Cadastrado em" valor={fmtData(imovel.criado_em)} />
                    <FichaItem
                      rotulo="Valor"
                      valor={brl(
                        imovel.finalidade === 'locacao' ? (imovel.valor_locacao ?? 0) : imovel.valor,
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            {estado.erro && (
              <div className="aviso aviso-erro" style={{ marginTop: 14 }}>
                <IconeAlerta />
                <span>{estado.erro}</span>
              </div>
            )}

            {!somenteLeitura && !proprietarioId && (
              <div className="aviso aviso-atencao" style={{ marginTop: 14 }}>
                <IconeAlerta />
                {/* O texto muda conforme a aba. Mandar alguem para a aba
                    Captacao estando nela e a forma mais rapida de fazer
                    um aviso parecer quebrado. */}
                <span>
                  {aba === 'captacao' ? (
                    <>
                      Escolha o proprietário acima para liberar o cadastro. É o único campo que não
                      dá para deixar para depois.
                    </>
                  ) : (
                    <>
                      Falta vincular o proprietário, na aba <strong>Captação</strong>. É o único
                      campo que não dá para deixar para depois.
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {somenteLeitura ? (
            gestor && (
              <footer className="gaveta-rodape gaveta-rodape-perigo">
                <span className="texto-mudo" style={{ flex: 1, fontSize: '0.82rem' }}>
                  Para tirar do site sem perder o registro, mude a situação para inativo.
                </span>
                <button type="button" className="btn btn-perigo" onClick={remover} disabled={pendente}>
                  <IconeLixeira />
                  Excluir
                </button>
              </footer>
            )
          ) : (
            <footer className="gaveta-rodape">
              <button
                type="button"
                className="btn btn-claro"
                onClick={() => (novo ? aoFechar() : setEditando(false))}
              >
                Cancelar
              </button>
              <button className="btn" type="submit" disabled={enviando || !proprietarioId}>
                {enviando ? 'Salvando...' : novo ? 'Cadastrar imóvel' : 'Salvar alterações'}
              </button>
            </footer>
          )}
        </form>
      </div>
    </>
  );
}

function FichaItem({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="ficha-item">
      <span className="indicador-rotulo">{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

'use client';

import { useActionState, useEffect, useState } from 'react';

import {
  AREAS_PERMISSAO,
  PAPEIS,
  permissoesPadrao,
  type Papel,
  type Perfil,
  type Permissoes,
} from '@boost/core';

import { salvarPessoa, type EstadoAcao } from '@/app/(painel)/equipe/acoes';
import { IconeAlerta, IconeCadeado, IconeFechar, IconeInfo } from '@/componentes/Icones';
import type { Carteira } from './Equipe';

const ESTADO_INICIAL: EstadoAcao = { ok: false };

/**
 * Cadastro de integrante.
 *
 * A escolha do papel reajusta as permissoes sozinha, mas nao as trava: a
 * combinacao mais comum numa imobiliaria pequena e um consultor de
 * confianca com acesso ao financeiro, e um sistema que impede isso
 * obriga a promover a pessoa a gestor so para liberar uma tela, o que
 * seria pior.
 *
 * O bloco de acesso so aparece para administrador. Para os demais a
 * gaveta vira apenas edicao de contato, que e exatamente o que a funcao
 * atualizar_perfil() do banco permite a cada pessoa sobre si mesma.
 */
export function GavetaPessoa({
  usuario,
  pessoa,
  equipe,
  carteira,
  aoFechar,
  aoConcluir,
}: {
  usuario: Perfil;
  pessoa: Perfil | null;
  equipe: Perfil[];
  carteira?: Carteira;
  aoFechar: () => void;
  aoConcluir: (mensagem: string, erro?: boolean) => void;
}) {
  const [estado, enviar, enviando] = useActionState(salvarPessoa, ESTADO_INICIAL);

  const novo = !pessoa;
  const eAdmin = usuario.papel === 'admin';
  const euMesmo = pessoa?.id === usuario.id;

  const [papel, setPapel] = useState<Papel>(pessoa?.papel ?? 'corretor');
  const [permissoes, setPermissoes] = useState<Permissoes>(
    pessoa?.permissoes ?? permissoesPadrao('corretor'),
  );

  useEffect(() => {
    if (estado.ok && estado.mensagem) aoConcluir(estado.mensagem);
  }, [estado, aoConcluir]);

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

  function trocarPapel(novoPapel: Papel) {
    setPapel(novoPapel);
    setPermissoes(permissoesPadrao(novoPapel));
  }

  const descricao = PAPEIS.find((p) => p.chave === papel);
  const soAdminAtivo = Boolean(
    equipe.filter((p) => p.papel === 'admin' && p.ativo).length <= 1 &&
      pessoa?.papel === 'admin' &&
      pessoa?.ativo,
  );

  return (
    <>
      <div className="fundo-escuro" onClick={aoFechar} aria-hidden="true" />

      <div className="gaveta" role="dialog" aria-modal="true" aria-label="Integrante da equipe">
        <header className="gaveta-topo">
          <div>
            <h2>{novo ? 'Cadastrar integrante' : (pessoa?.nome ?? '')}</h2>
            <p>
              {novo
                ? 'A pessoa recebe um convite por e-mail e define a própria senha.'
                : euMesmo
                  ? 'Seus dados de contato.'
                  : 'Cadastro, papel e permissões de acesso.'}
            </p>
          </div>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <IconeFechar />
          </button>
        </header>

        <form action={enviar} style={{ display: 'contents' }}>
          <input type="hidden" name="id" value={pessoa?.id ?? ''} />

          <div className="gaveta-corpo">
            <div className="formulario">
              <div className="campo">
                <label htmlFor="nome">
                  Nome completo<span className="obrigatorio">*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  defaultValue={pessoa?.nome ?? ''}
                  maxLength={120}
                  required
                  autoFocus
                />
              </div>

              <div className="linha-campos">
                <div className="campo">
                  <label htmlFor="email">
                    E-mail de acesso
                    {novo && <span className="obrigatorio">*</span>}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={pessoa?.email ?? ''}
                    placeholder="nome@boostimoveis.com.br"
                    required={novo}
                  />
                  {novo && <span className="ajuda">O convite vai para este endereço.</span>}
                </div>

                <div className="campo">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    name="telefone"
                    defaultValue={pessoa?.telefone ?? ''}
                    inputMode="tel"
                    placeholder="(34) 90000-0000"
                  />
                </div>
              </div>

              <div className="linha-campos">
                <div className="campo">
                  <label htmlFor="creci">CRECI</label>
                  <input
                    id="creci"
                    name="creci"
                    defaultValue={pessoa?.creci ?? ''}
                    placeholder="CRECI-MG 00000"
                  />
                  <span className="ajuda">
                    Aparece no anúncio dos imóveis captados por esta pessoa.
                  </span>
                </div>

                <div className="campo">
                  <label htmlFor="meta_mensal">Meta mensal de VGV</label>
                  <div className="campo-prefixado">
                    <span>R$</span>
                    <input
                      id="meta_mensal"
                      name="meta_mensal"
                      inputMode="numeric"
                      defaultValue={pessoa?.meta_mensal ? String(pessoa.meta_mensal) : ''}
                      placeholder="1500000"
                      disabled={!eAdmin}
                    />
                  </div>
                  <span className="ajuda">Base do atingimento nos indicadores.</span>
                </div>
              </div>

              {eAdmin ? (
                <>
                  <div className="campo">
                    <label htmlFor="papel">Papel no sistema</label>
                    <select
                      id="papel"
                      name="papel"
                      value={papel}
                      onChange={(e) => trocarPapel(e.target.value as Papel)}
                      disabled={euMesmo}
                    >
                      {PAPEIS.map((p) => (
                        <option key={p.chave} value={p.chave}>
                          {p.rotulo}
                        </option>
                      ))}
                    </select>
                    {euMesmo && (
                      <>
                        {/* Sem isto o formulario nao enviaria papel
                            nenhum, e o banco leria a edicao do proprio
                            telefone como uma tentativa de rebaixamento. */}
                        <input type="hidden" name="papel" value={papel} />
                        <span className="ajuda">
                          Ninguém altera o próprio papel. Peça a outro administrador.
                        </span>
                      </>
                    )}
                  </div>

                  {descricao && (
                    <div className="cartao-papel">
                      <strong>{descricao.resumo}</strong>
                      <ul>
                        {descricao.alcance.map((linha) => (
                          <li key={linha}>{linha}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="campo">
                    <label>Áreas liberadas</label>
                    <div className="grade-permissoes">
                      {AREAS_PERMISSAO.map((area) => (
                        <label key={area.chave} className="interruptor">
                          <input
                            type="checkbox"
                            name={`perm_${area.chave}`}
                            checked={papel === 'admin' ? true : permissoes[area.chave]}
                            disabled={papel === 'admin'}
                            onChange={(e) =>
                              setPermissoes({ ...permissoes, [area.chave]: e.target.checked })
                            }
                          />
                          <span className="interruptor-trilho" />
                          <span className="interruptor-texto">
                            <strong>{area.rotulo}</strong>
                            <span>{area.explicacao}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {papel === 'admin' && (
                      <>
                        {/* Campo desabilitado nao viaja no formulario. O
                            valor vai por aqui para o registro gravado
                            bater com o que a tela mostra. */}
                        {AREAS_PERMISSAO.map((area) => (
                          <input
                            key={area.chave}
                            type="hidden"
                            name={`perm_${area.chave}`}
                            value="on"
                          />
                        ))}
                        <span className="ajuda">
                          Administrador enxerga tudo por definição. As permissões voltam a valer se
                          o papel mudar.
                        </span>
                      </>
                    )}
                  </div>

                  {soAdminAtivo && (
                    <div className="aviso aviso-atencao">
                      <IconeCadeado />
                      <span>
                        Esta é a única conta de administrador ativa. O banco recusa rebaixá-la ou
                        desativá-la enquanto não houver outra.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="aviso aviso-info">
                  <IconeInfo />
                  <span>
                    Papel, permissões e situação de acesso são alterados apenas por um
                    administrador.
                  </span>
                </div>
              )}

              {carteira && (carteira.leads > 0 || carteira.imoveis > 0) && (
                <div className="aviso aviso-info">
                  <IconeInfo />
                  <span>
                    Hoje esta pessoa responde por <strong>{carteira.leads}</strong> leads e{' '}
                    <strong>{carteira.imoveis}</strong> imóveis.
                  </span>
                </div>
              )}

              {estado.erro && (
                <div className="aviso aviso-erro">
                  <IconeAlerta />
                  <span>{estado.erro}</span>
                </div>
              )}
            </div>
          </div>

          <footer className="gaveta-rodape">
            <button type="button" className="btn btn-claro" onClick={aoFechar}>
              Cancelar
            </button>
            <button className="btn" type="submit" disabled={enviando}>
              {enviando
                ? 'Salvando...'
                : novo
                  ? 'Cadastrar e enviar convite'
                  : 'Salvar alterações'}
            </button>
          </footer>
        </form>
      </div>
    </>
  );
}

'use server';

import { revalidatePath } from 'next/cache';

import { alterarImovelDemo, excluirImovelDemo, salvarImovelDemo } from '@/lib/dados-demo';
import { modoDemo } from '@/lib/demonstracao';
import { exigirUsuario } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export interface EstadoAcao {
  ok: boolean;
  erro?: string;
  mensagem?: string;
}

const FINALIDADES = ['venda', 'locacao', 'venda_locacao'];
const STATUS = ['disponivel', 'reservado', 'vendido', 'locado', 'inativo'];

function texto(dados: FormData, campo: string): string {
  return String(dados.get(campo) ?? '').trim();
}

/**
 * Numero a partir do que a pessoa digitou.
 *
 * Quem cadastra imovel digita preco do jeito que le em contrato, com
 * ponto de milhar e virgula decimal. Recusar isso obrigaria a apagar a
 * pontuacao na mao em cada campo de dinheiro da ficha, e o campo de
 * dinheiro aparece cinco vezes.
 *
 * A ordem das regras resolve a unica ambiguidade real, que e "6.500":
 * pode ser seis mil e quinhentos ou seis e meio. No Brasil, e a
 * primeira leitura — e num cadastro de imovel, mais ainda. Por isso
 * grupos de exatamente tres digitos separados por ponto sao tratados
 * como milhar, e o ponto so vira decimal quando o que vem depois dele
 * nao tem tres digitos ("1250000.50", que e como sai do teclado
 * numerico).
 */
function numero(dados: FormData, campo: string): number {
  const bruto = texto(dados, campo).replace(/[^\d.,-]/g, '');
  if (!bruto) return 0;

  let normalizado: string;

  if (bruto.includes(',')) {
    // Virgula presente: ela e o decimal, e todo ponto e milhar.
    normalizado = bruto.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(bruto)) {
    // 1.250.000 e 6.500: so grupos de tres, entao e milhar.
    normalizado = bruto.replace(/\./g, '');
  } else {
    // 1250000.50: ponto decimal, deixa como esta.
    normalizado = bruto;
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function inteiro(dados: FormData, campo: string): number {
  const valor = Number(texto(dados, campo).replace(/\D/g, ''));
  return Number.isFinite(valor) ? valor : 0;
}

/**
 * A vitrine tambem precisa saber.
 *
 * O site le a mesma base, e sem invalidar as rotas publicas um imovel
 * editado continuaria aparecendo com o texto antigo ate o cache de
 * cinco minutos virar.
 */
function atualizarImoveis() {
  revalidatePath('/imoveis');
  revalidatePath('/proprietarios');
  revalidatePath('/');
}

/**
 * Publicar ou tirar do ar.
 *
 * O efeito e imediato no site: a vitrine le a view vitrine_imoveis, que
 * so mostra o que esta publicado, e o revalidate de cinco minutos do
 * site republica a listagem. Vale avisar quem usa: nao e instantaneo.
 */
export async function alternarPublicacao(id: string, publicado: boolean): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  if (modoDemo()) {
    const r = alterarImovelDemo(usuario, id, { publicado });
    revalidatePath('/imoveis');
    return r.ok
      ? {
          ok: true,
          mensagem: publicado
            ? 'Imóvel publicado. Recarregue o site para vê-lo na vitrine.'
            : 'Imóvel retirado da vitrine.',
        }
      : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const { error } = await supabase.from('imoveis').update({ publicado }).eq('id', id);

  if (error) {
    console.error('[imoveis] falha ao publicar:', error);
    return { ok: false, erro: traduzirErro(error.message) };
  }

  revalidatePath('/imoveis');
  return {
    ok: true,
    mensagem: publicado
      ? 'Imóvel publicado. Aparece no site em até 5 minutos.'
      : 'Imóvel retirado da vitrine.',
  };
}

export async function alternarDestaque(id: string, destaque: boolean): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  if (modoDemo()) {
    const r = alterarImovelDemo(usuario, id, { destaque });
    revalidatePath('/imoveis');
    return r.ok
      ? { ok: true, mensagem: destaque ? 'Marcado como destaque.' : 'Destaque removido.' }
      : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const { error } = await supabase.from('imoveis').update({ destaque }).eq('id', id);

  if (error) return { ok: false, erro: traduzirErro(error.message) };

  revalidatePath('/imoveis');
  return { ok: true, mensagem: destaque ? 'Marcado como destaque.' : 'Destaque removido.' };
}

export async function mudarStatusImovel(id: string, status: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  const permitidos = ['disponivel', 'reservado', 'vendido', 'locado', 'inativo'];
  if (!permitidos.includes(status)) return { ok: false, erro: 'Situação inválida.' };

  // Imovel vendido, locado ou inativo sai da vitrine junto. Deixar um
  // vendido publicado gera visita perdida e cliente irritado.
  const alteracao: Record<string, unknown> = { status };
  if (['vendido', 'locado', 'inativo'].includes(status)) {
    alteracao.publicado = false;
    alteracao.destaque = false;
  }

  if (modoDemo()) {
    const r = alterarImovelDemo(usuario, id, alteracao);
    revalidatePath('/imoveis');
    return r.ok ? { ok: true, mensagem: 'Situação atualizada.' } : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const { error } = await supabase.from('imoveis').update(alteracao).eq('id', id);

  if (error) return { ok: false, erro: traduzirErro(error.message) };

  revalidatePath('/imoveis');
  return { ok: true, mensagem: 'Situação atualizada.' };
}

/** Transferir a carteira. Somente a gestao reatribui imovel de alguem. */
export async function atribuirCorretor(id: string, corretorId: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  if (usuario.papel !== 'admin' && usuario.papel !== 'gestor') {
    return { ok: false, erro: 'Apenas a gestão pode transferir imóveis entre consultores.' };
  }

  if (modoDemo()) {
    const r = alterarImovelDemo(usuario, id, { corretor_id: corretorId || null });
    revalidatePath('/imoveis');
    return r.ok ? { ok: true, mensagem: 'Imóvel transferido.' } : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from('imoveis')
    .update({ corretor_id: corretorId || null })
    .eq('id', id);

  if (error) return { ok: false, erro: traduzirErro(error.message) };

  revalidatePath('/imoveis');
  return { ok: true, mensagem: 'Imóvel transferido.' };
}


/**
 * Cadastra ou edita um imóvel.
 *
 * A regra que este projeto ganhou agora: **não existe imóvel sem
 * proprietário**. A recusa acontece aqui, no servidor, e não só no
 * `required` do formulário — o campo do navegador é conveniência para
 * quem digita, não garantia. Qualquer coisa que chegue por outro
 * caminho (uma importação, um script, um formulário adulterado) esbarra
 * nesta linha.
 *
 * O motivo é operacional, não burocrático. Imóvel sem proprietário é
 * imóvel que ninguém sabe de quem é quando aparece uma proposta: não há
 * quem autorize a visita, não há quem assine, e a comissão fica sem
 * origem. A carteira importada por XML tem exatamente esse buraco, e é
 * o que o filtro "sem proprietário" da lista serve para caçar.
 */
export async function salvarImovel(_anterior: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  const id = texto(dados, 'id');
  const titulo = texto(dados, 'titulo');
  const proprietarioId = texto(dados, 'proprietario_id');

  if (titulo.length < 4) return { ok: false, erro: 'Dê um título ao imóvel.' };
  if (!proprietarioId) {
    return {
      ok: false,
      erro: 'Vincule um proprietário. Todo imóvel precisa de alguém que responda por ele.',
    };
  }

  const finalidade = texto(dados, 'finalidade') || 'venda';
  if (!FINALIDADES.includes(finalidade)) return { ok: false, erro: 'Finalidade inválida.' };

  const status = texto(dados, 'status') || 'disponivel';
  if (!STATUS.includes(status)) return { ok: false, erro: 'Situação inválida.' };

  const valor = numero(dados, 'valor');
  const valorLocacao = numero(dados, 'valor_locacao');

  if (finalidade !== 'locacao' && valor <= 0) {
    return { ok: false, erro: 'Informe o valor de venda.' };
  }
  if (finalidade !== 'venda' && valorLocacao <= 0) {
    return { ok: false, erro: 'Informe o valor do aluguel.' };
  }

  const gestor = usuario.papel === 'admin' || usuario.papel === 'gestor';

  const registro = {
    titulo: titulo.slice(0, 160),
    descricao: texto(dados, 'descricao').slice(0, 6000) || null,
    tipo: texto(dados, 'tipo') || 'Apartamento',
    finalidade,
    status,

    cep: texto(dados, 'cep').replace(/\D/g, '') || null,
    logradouro: texto(dados, 'logradouro') || null,
    numero: texto(dados, 'numero') || null,
    complemento: texto(dados, 'complemento') || null,
    bairro: texto(dados, 'bairro') || null,
    cidade: texto(dados, 'cidade') || 'Uberlândia',
    uf: (texto(dados, 'uf') || 'MG').toUpperCase().slice(0, 2),
    exibir_endereco: dados.get('exibir_endereco') === 'on',

    valor,
    valor_locacao: valorLocacao || null,
    valor_condominio: numero(dados, 'valor_condominio') || null,
    valor_iptu: numero(dados, 'valor_iptu') || null,
    aceita_permuta: dados.get('aceita_permuta') === 'on',
    aceita_financiamento: dados.get('aceita_financiamento') === 'on',

    area_util: numero(dados, 'area_util'),
    area_total: numero(dados, 'area_total'),
    hectares: numero(dados, 'hectares') || null,
    quartos: inteiro(dados, 'quartos'),
    suites: inteiro(dados, 'suites'),
    banheiros: inteiro(dados, 'banheiros'),
    vagas: inteiro(dados, 'vagas'),
    ano_construcao: inteiro(dados, 'ano_construcao') || null,
    andar: inteiro(dados, 'andar') || null,
    mobiliado: dados.get('mobiliado') === 'on',

    // Uma característica por linha no textarea. É mais rápido de
    // digitar que um campo de etiquetas e não exige mouse, o que
    // importa para quem cadastra vinte imóveis numa tarde.
    caracteristicas: texto(dados, 'caracteristicas')
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 40),

    proprietario_id: proprietarioId,
    corretor_id: gestor ? texto(dados, 'corretor_id') || null : usuario.id,
    exclusividade: dados.get('exclusividade') === 'on',
    autorizacao_ate: texto(dados, 'autorizacao_ate') || null,
    matricula: texto(dados, 'matricula') || null,
    observacoes_internas: texto(dados, 'observacoes_internas').slice(0, 3000) || null,
  };

  if (modoDemo()) {
    const r = salvarImovelDemo(usuario, { ...registro, id: id || undefined } as never);
    atualizarImoveis();
    return r.ok
      ? { ok: true, mensagem: id ? 'Imóvel atualizado.' : 'Imóvel cadastrado, ainda fora do ar.' }
      : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const resposta = id
    ? await supabase.from('imoveis').update(registro).eq('id', id)
    : await supabase.from('imoveis').insert({
        ...registro,
        // Nasce fora do ar. Publicar é um segundo gesto, deliberado:
        // imóvel recém-cadastrado ainda não tem foto nem revisão de
        // texto, e ir direto para a vitrine é deixar a vitrine aberta
        // durante a arrumação.
        publicado: false,
        destaque: false,
        fonte: 'manual',
      });

  if (resposta.error) {
    console.error('[imoveis] falha ao salvar:', resposta.error);
    return { ok: false, erro: traduzirErro(resposta.error.message) };
  }

  atualizarImoveis();
  return {
    ok: true,
    mensagem: id ? 'Imóvel atualizado.' : 'Imóvel cadastrado, ainda fora do ar.',
  };
}

/**
 * Exclusão definitiva.
 *
 * Só a gestão, e só quando não há negociação em andamento. Um imóvel
 * com proposta aberta que desaparece leva junto o rastro de uma
 * comissão que alguém vai cobrar no fim do mês — e aí não há como
 * reconstruir de quem era.
 *
 * Para tirar da vitrine sem perder o registro existe o caminho normal,
 * que é mudar a situação para inativo. É o que a mensagem de confirmação
 * da tela oferece antes.
 */
export async function excluirImovel(id: string): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  if (usuario.papel !== 'admin' && usuario.papel !== 'gestor') {
    return { ok: false, erro: 'Apenas a gestão exclui um imóvel em definitivo.' };
  }

  if (modoDemo()) {
    const r = excluirImovelDemo(usuario, id);
    atualizarImoveis();
    return r.ok ? { ok: true, mensagem: 'Imóvel excluído.' } : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const { data: emAberto, error: erroVenda } = await supabase
    .from('vendas')
    .select('codigo')
    .eq('imovel_id', id)
    .not('status', 'in', '(cancelada,concluida)')
    .limit(1);

  if (erroVenda) {
    console.error('[imoveis] falha ao verificar negociações:', erroVenda);
    return { ok: false, erro: 'Não foi possível verificar as negociações agora.' };
  }

  if (emAberto && emAberto.length > 0) {
    return {
      ok: false,
      erro: `Existe uma negociação em andamento (${emAberto[0].codigo}) neste imóvel. Conclua ou cancele antes de excluir.`,
    };
  }

  const { error } = await supabase.from('imoveis').delete().eq('id', id);

  if (error) {
    console.error('[imoveis] falha ao excluir:', error);
    return { ok: false, erro: traduzirErro(error.message) };
  }

  atualizarImoveis();
  return { ok: true, mensagem: 'Imóvel excluído.' };
}

/** Vincula um proprietário a um imóvel que ficou sem, vindo da importação. */
export async function vincularProprietario(
  id: string,
  proprietarioId: string,
): Promise<EstadoAcao> {
  const usuario = await exigirUsuario();

  if (!proprietarioId) return { ok: false, erro: 'Escolha um proprietário.' };

  if (modoDemo()) {
    const r = alterarImovelDemo(usuario, id, { proprietario_id: proprietarioId });
    atualizarImoveis();
    return r.ok ? { ok: true, mensagem: 'Proprietário vinculado.' } : { ok: false, erro: r.erro };
  }

  const supabase = await supabaseServidor();

  const { error } = await supabase
    .from('imoveis')
    .update({ proprietario_id: proprietarioId })
    .eq('id', id);

  if (error) return { ok: false, erro: traduzirErro(error.message) };

  atualizarImoveis();
  return { ok: true, mensagem: 'Proprietário vinculado.' };
}
function traduzirErro(mensagem: string): string {
  if (mensagem.includes('row-level security')) {
    return 'Este imóvel está na carteira de outro consultor. Só ele ou a gestão pode alterá-lo.';
  }
  return 'Não foi possível salvar agora. Tente novamente.';
}

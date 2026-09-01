/**
 * Cria o acesso de cada consultor e atrela a carteira a ele.
 *
 * O sistema nasceu com dois usuarios e 964 imoveis sem responsavel. Quem
 * captou cada imovel esta no XLS exportado do sistema antigo, na coluna
 * "Captador(es)" — e so ali: o feed que alimentou o banco nao traz esse
 * campo. Este script faz a ponte uma vez.
 *
 * Roda em simulacao por padrao. Nada e escrito sem --aplicar, porque
 * criar dezenas de acessos e reatribuir novecentos imoveis nao e o tipo
 * de coisa que se descobre errada depois.
 *
 *   node scripts/importar-consultores.mjs
 *   node scripts/importar-consultores.mjs --aplicar --senha "uma frase longa"
 *
 * Rodar duas vezes nao duplica nada: o acesso e reaproveitado pelo
 * e-mail e a atribuicao e idempotente.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOMINIO = 'boostimoveis.com.br';

/**
 * Contas da casa, nao pessoas.
 *
 * Sao 421 imoveis, quase metade da carteira. Ficam sem responsavel de
 * proposito: a tela mostra "Sem responsavel" e a gestao redistribui pela
 * selecao em lote. Inventar um usuario "Boost" para segurar todos eles
 * apagaria justamente a pergunta que precisa ser respondida — de quem e
 * cada um.
 */
const CONTAS_DA_CASA = new Set(['boost', 'geral boost']);

/** Particulas que nao entram no e-mail. */
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// ------------------------------------------------------------
// ARGUMENTOS
// ------------------------------------------------------------

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const senha = valorDe('--senha') ?? process.env.SENHA_PROVISORIA ?? '';
const arquivoXls = valorDe('--xls') ?? 'imoveis-23-08-2026.xls';

function valorDe(bandeira) {
  const i = args.indexOf(bandeira);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
}

// ------------------------------------------------------------
// AMBIENTE
// ------------------------------------------------------------

/**
 * Le o .env.local na mao.
 *
 * Um script solto nao passa pelo carregador do Next, entao as variaveis
 * nao chegam sozinhas. E o arquivo nunca e alterado aqui — so lido.
 */
function lerAmbiente() {
  const caminho = path.join(raiz, '.env.local');
  if (!fs.existsSync(caminho)) return {};

  const mapa = {};
  for (const linha of fs.readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const corte = linha.indexOf('=');
    if (corte < 1 || linha.trimStart().startsWith('#')) continue;
    mapa[linha.slice(0, corte).trim()] = linha.slice(corte + 1).trim();
  }
  return mapa;
}

const env = { ...lerAmbiente(), ...process.env };
const urlSupabase = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const chaveServico = env.SUPABASE_SERVICE_ROLE_KEY;

// ------------------------------------------------------------
// LEITURA DO XLSX
// ------------------------------------------------------------

/**
 * Abre um .xlsx sem biblioteca.
 *
 * Um xlsx e um zip de XMLs. Ler o diretorio central e inflar a entrada
 * que interessa cabe em trinta linhas, e evita uma dependencia inteira
 * num script que roda uma vez na vida do projeto.
 */
function lerEntradaZip(buffer, nomeProcurado) {
  // O fim do diretorio central fica no rodape do arquivo.
  let fim = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error('Arquivo não parece um .xlsx (zip sem diretório central).');

  const total = buffer.readUInt16LE(fim + 10);
  let ponteiro = buffer.readUInt32LE(fim + 16);

  for (let k = 0; k < total; k++) {
    const compressao = buffer.readUInt16LE(ponteiro + 10);
    const tamanhoComprimido = buffer.readUInt32LE(ponteiro + 20);
    const tamanhoNome = buffer.readUInt16LE(ponteiro + 28);
    const tamanhoExtra = buffer.readUInt16LE(ponteiro + 30);
    const tamanhoComentario = buffer.readUInt16LE(ponteiro + 32);
    const deslocamento = buffer.readUInt32LE(ponteiro + 42);
    const nome = buffer.toString('utf8', ponteiro + 46, ponteiro + 46 + tamanhoNome);

    if (nome === nomeProcurado) {
      // O cabecalho local repete nome e extra, com tamanhos proprios.
      const nomeLocal = buffer.readUInt16LE(deslocamento + 26);
      const extraLocal = buffer.readUInt16LE(deslocamento + 28);
      const inicio = deslocamento + 30 + nomeLocal + extraLocal;
      const dados = buffer.subarray(inicio, inicio + tamanhoComprimido);
      return compressao === 0 ? dados : zlib.inflateRawSync(dados);
    }

    ponteiro += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }

  throw new Error(`Entrada ${nomeProcurado} não encontrada no arquivo.`);
}

const ENTIDADES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };

function desescapar(texto) {
  return texto.replace(/&(amp|lt|gt|quot|apos);/g, (m) => ENTIDADES[m]);
}

/** Referência (coluna B) e Captador(es) (coluna Y) de cada linha da planilha. */
function lerPlanilha(caminho) {
  const xml = lerEntradaZip(fs.readFileSync(caminho), 'xl/worksheets/sheet1.xml').toString('utf8');
  const linhas = [];

  for (const linha of xml.matchAll(/<row r="(\d+)"[\s\S]*?<\/row>/g)) {
    if (linha[1] === '1') continue; // cabeçalho

    let referencia = '';
    let captador = '';

    for (const celula of linha[0].matchAll(/<c r="([A-Z]+)\d+"[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g)) {
      const valor = celula[2] ? desescapar(celula[2]).trim() : '';
      if (celula[1] === 'B') referencia = valor;
      if (celula[1] === 'Y') captador = valor;
    }

    if (referencia) linhas.push({ referencia, captador });
  }

  return linhas;
}

// ------------------------------------------------------------
// NOMES E E-MAILS
// ------------------------------------------------------------

/**
 * Escolhe uma pessoa a partir do campo "Captador(es)".
 *
 * O campo aceita mais de um nome separado por vírgula, e aparecem tanto
 * repetições ("Danielle Oliveira,Danielle Oliveira") quanto mistura com
 * a conta da casa ("BOOST,Luana Lima"). Nos dois casos quem interessa é
 * a pessoa: a casa é o valor de quando ninguém foi registrado.
 */
function pessoaDoCampo(campo) {
  const nomes = String(campo || '')
    .split(/[;,/]/)
    .map((n) => n.trim())
    .filter(Boolean);

  for (const nome of nomes) {
    if (!CONTAS_DA_CASA.has(nome.toLowerCase())) return nome;
  }
  return null;
}

function semAcento(texto) {
  // A classe vai como escape, e nao com os combinantes literais: eles
  // sao invisiveis no editor e somem num salvamento descuidado.
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** "João Victor Barreto Camargos" -> joao.camargos@boostimoveis.com.br */
function emailDe(nome) {
  const partes = semAcento(nome)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !PARTICULAS.has(p));

  if (partes.length === 0) return null;

  const local = partes.length === 1 ? partes[0] : `${partes[0]}.${partes[partes.length - 1]}`;
  return `${local}@${DOMINIO}`;
}

/** Referência do banco vem com o sufixo do feed: AP0453-INYK -> AP0453. */
function referenciaBase(valor) {
  return String(valor ?? '').trim().toUpperCase().replace(/-[A-Z]+$/, '');
}

// ------------------------------------------------------------
// EXECUÇÃO
// ------------------------------------------------------------

async function principal() {
  if (!urlSupabase || !chaveServico) {
    encerrar('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.');
  }

  const caminhoXls = path.isAbsolute(arquivoXls) ? arquivoXls : path.join(raiz, arquivoXls);
  if (!fs.existsSync(caminhoXls)) encerrar(`Planilha não encontrada: ${caminhoXls}`);

  if (aplicar && senha.length < 8) {
    encerrar('Informe a senha provisória com --senha "..." (mínimo 8 caracteres).');
  }

  const supabase = createClient(urlSupabase, chaveServico, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(aplicar ? '>> MODO APLICAR: o banco será alterado.' : '>> SIMULAÇÃO: nada será alterado. Use --aplicar para valer.');
  console.log('');

  // ---------- planilha ----------
  const planilha = lerPlanilha(caminhoXls);
  const captadorPorReferencia = new Map(
    planilha.map((l) => [l.referencia.toUpperCase(), l.captador]),
  );
  console.log(`Planilha: ${planilha.length} linhas lidas de ${path.basename(caminhoXls)}.`);

  // ---------- carteira ----------
  const carteira = await lerCarteira(supabase);
  console.log(`Banco...: ${carteira.length} imóveis.`);

  // ---------- cruzamento ----------
  const porPessoa = new Map();
  let semPar = 0;
  let daCasa = 0;

  for (const imovel of carteira) {
    const linha = captadorPorReferencia.get(referenciaBase(imovel.referencia_externa));
    if (linha === undefined) {
      semPar += 1;
      continue;
    }

    const pessoa = pessoaDoCampo(linha);
    if (!pessoa) {
      daCasa += 1;
      continue;
    }

    if (!porPessoa.has(pessoa)) porPessoa.set(pessoa, []);
    porPessoa.get(pessoa).push(imovel.id);
  }

  console.log(`Sem par na planilha: ${semPar}. Conta da casa, seguem sem responsável: ${daCasa}.`);
  console.log('');

  // ---------- e-mails, com checagem de colisão ----------
  const pessoas = [...porPessoa.entries()]
    .map(([nome, imoveis]) => ({ nome, email: emailDe(nome), imoveis }))
    .sort((a, b) => b.imoveis.length - a.imoveis.length);

  const vistos = new Map();
  const colisoes = [];
  for (const p of pessoas) {
    if (!p.email) colisoes.push(`nome sem letras utilizáveis: ${p.nome}`);
    else if (vistos.has(p.email)) colisoes.push(`${p.email}: ${vistos.get(p.email)} e ${p.nome}`);
    else vistos.set(p.email, p.nome);
  }

  console.log(`${pessoas.length} consultores, ${pessoas.reduce((s, p) => s + p.imoveis.length, 0)} imóveis atribuíveis:`);
  console.log('');
  for (const p of pessoas) {
    console.log(`  ${String(p.imoveis.length).padStart(4)}  ${p.email ?? '(sem e-mail)'}${' '.repeat(Math.max(0, 42 - (p.email?.length ?? 12)))}${p.nome}`);
  }
  console.log('');

  if (colisoes.length > 0) {
    console.log('!! E-mails em conflito. Resolva antes de aplicar:');
    for (const c of colisoes) console.log('   -', c);
    encerrar('Nada foi alterado.');
  }

  if (!aplicar) {
    console.log('Para aplicar:  node scripts/importar-consultores.mjs --aplicar --senha "sua senha provisória"');
    return;
  }

  // ---------- acessos ----------
  const { data: existentes, error: erroPerfis } = await supabase
    .from('perfis')
    .select('id, email');
  if (erroPerfis) encerrar(`Falha ao ler perfis: ${erroPerfis.message}`);

  const idPorEmail = new Map(
    (existentes ?? []).filter((p) => p.email).map((p) => [p.email.toLowerCase(), p.id]),
  );

  let criados = 0;
  let reaproveitados = 0;

  for (const pessoa of pessoas) {
    const jaTem = idPorEmail.get(pessoa.email);
    if (jaTem) {
      pessoa.id = jaTem;
      reaproveitados += 1;
      continue;
    }

    // email_confirm: true marca o endereço como verificado sem enviar
    // nada. É o mesmo caminho da tela de Equipe: aqui não há convite por
    // e-mail, o acesso é entregue à mão.
    const { data, error } = await supabase.auth.admin.createUser({
      email: pessoa.email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: pessoa.nome },
    });

    if (error) {
      console.log(`   ! ${pessoa.email}: ${error.message}`);
      continue;
    }

    pessoa.id = data.user?.id;
    criados += 1;

    // O gatilho ao_criar_usuario já cria o perfil como corretor; falta o
    // nome, que o gatilho não tem como saber.
    const { error: erroNome } = await supabase
      .from('perfis')
      .update({ nome: pessoa.nome })
      .eq('id', pessoa.id);
    if (erroNome) console.log(`   ! nome de ${pessoa.email}: ${erroNome.message}`);
  }

  console.log('');
  console.log(`Acessos criados: ${criados}. Já existiam: ${reaproveitados}.`);

  // ---------- atribuição ----------
  let atribuidos = 0;

  for (const pessoa of pessoas) {
    if (!pessoa.id) continue;

    // Lotes de 200: a lista de ids viaja na URL, e uma query string com
    // novecentos uuids estoura o limite do servidor.
    for (let i = 0; i < pessoa.imoveis.length; i += 200) {
      const lote = pessoa.imoveis.slice(i, i + 200);
      const { data, error } = await supabase
        .from('imoveis')
        .update({ corretor_id: pessoa.id })
        .in('id', lote)
        .select('id');

      if (error) {
        console.log(`   ! ${pessoa.email}: ${error.message}`);
        break;
      }
      atribuidos += (data ?? []).length;
    }
  }

  console.log(`Imóveis atribuídos: ${atribuidos}.`);
  console.log('');
  console.log('Todos entraram com a mesma senha provisória. Peça a troca no primeiro acesso —');
  console.log('enquanto ela valer, quem a tiver entra na conta de qualquer um dos outros.');
}

/** A carteira inteira, em faixas de mil: o PostgREST não devolve mais que isso. */
async function lerCarteira(supabase) {
  const linhas = [];

  for (;;) {
    const de = linhas.length;
    const { data, error } = await supabase
      .from('imoveis')
      .select('id, referencia_externa')
      .order('codigo', { ascending: true })
      .range(de, de + 999);

    if (error) encerrar(`Falha ao ler a carteira: ${error.message}`);
    if (!data || data.length === 0) break;

    linhas.push(...data);
    if (data.length < 1000) break;
  }

  return linhas;
}

function encerrar(mensagem) {
  console.error(`\n${mensagem}`);
  process.exit(1);
}

principal().catch((erro) => encerrar(erro.stack ?? String(erro)));

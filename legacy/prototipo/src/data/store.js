// Camada de acesso a dados. Hoje opera sobre o estado em memoria.
// Quando o Supabase for sincronizado, cada funcao passa a ler e gravar
// no banco, mantendo a mesma assinatura. O resto do app nao muda.

import { state } from './state.js';

const eq = (a, b) => String(a) === String(b);

// ---------- IMOVEIS ----------
export async function fetchImoveis() {
  return state.imoveis;
}
export async function createImovel(dados) {
  const novo = { id: Date.now(), fotos: [], ...dados };
  state.imoveis.unshift(novo);
  return novo;
}
export async function updateImovel(id, patch) {
  const i = state.imoveis.find((x) => eq(x.id, id));
  if (i) Object.assign(i, patch);
  return i;
}
export async function deleteImovel(id) {
  state.imoveis = state.imoveis.filter((x) => !eq(x.id, id));
}

// ---------- LEADS ----------
export async function fetchLeads() {
  return state.leads;
}
export async function updateLeadEtapa(id, etapa) {
  const l = state.leads.find((x) => eq(x.id, id));
  if (l) l.etapa = etapa;
}
export async function addLeadObs(id, texto, autor) {
  const l = state.leads.find((x) => eq(x.id, id));
  if (!l) return;
  if (!l.observacoes) l.observacoes = [];
  l.observacoes.unshift({ texto, autor, data: hoje() });
}
export async function toggleArquivarLead(id) {
  const l = state.leads.find((x) => eq(x.id, id));
  if (l) l.arquivado = !l.arquivado;
  return l;
}
export async function deleteLead(id) {
  state.leads = state.leads.filter((x) => !eq(x.id, id));
}

// ---------- USUARIOS ----------
export async function fetchUsuarios() {
  return state.usuarios;
}
export async function createUsuario(dados) {
  const novo = {
    id: 'u' + Date.now(),
    ativo: true,
    permissoes: { imoveis: true, leads: true, financeiro: false, usuarios: false },
    criado_em: hoje(),
    ...dados
  };
  state.usuarios.push(novo);
  return novo;
}
export async function updateUsuario(id, patch) {
  const u = state.usuarios.find((x) => eq(x.id, id));
  if (u) Object.assign(u, patch);
  return u;
}
export async function deleteUsuario(id) {
  state.usuarios = state.usuarios.filter((x) => !eq(x.id, id));
}

// ---------- FINANCEIRO ----------
export async function fetchTransacoes() {
  return state.transacoes;
}
export async function createTransacao(dados) {
  const nova = { id: 't' + Date.now(), status: 'pendente', venda: 0, ...dados };
  state.transacoes.unshift(nova);
  return nova;
}
export async function updateTransacao(id, patch) {
  const t = state.transacoes.find((x) => eq(x.id, id));
  if (t) Object.assign(t, patch);
  return t;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

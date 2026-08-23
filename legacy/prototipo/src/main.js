import './styles/main.css';
import { covers } from './lib/format.js';
import { isSupabaseConfigured } from './lib/supabase.js';
import { signIn, signOut, getSession } from './lib/auth.js';
import { state } from './data/state.js';
import { currentUser, isAdmin, can, canManageImovel, setActingUser } from './lib/session.js';
import {
  createImovel, updateImovel, deleteImovel,
  updateLeadEtapa, addLeadObs, toggleArquivarLead, deleteLead,
  createUsuario, updateUsuario, deleteUsuario,
  createTransacao, updateTransacao
} from './data/store.js';
import * as R from './ui/render.js';

let filtroImoveis = 'todos';
let mostrarArquivados = false;
let formFotos = [];

const titles = {
  painel: ['Gestao', 'Painel'],
  imoveis: ['Carteira', 'Imoveis'],
  leads: ['Relacionamento', 'Leads'],
  financeiro: ['Gestao', 'Financeiro'],
  usuarios: ['Administracao', 'Usuarios'],
  vitrine: ['Publico', 'Vitrine']
};

document.addEventListener('DOMContentLoaded', () => {
  wireLogin();
  wireNav();
  wireMobile();
  wireImoveis();
  wireLeads();
  wireUsuarios();
  wireFinanceiro();
  wireModaisGlobais();
  wireSearch();
  wireActing();
  wireLogout();
  mostrarBadge();
  getSession().then((s) => { if (s) entrar(); });
});

// ---------- LOGIN ----------
function wireLogin() {
  document.getElementById('btnEntrar').addEventListener('click', fazerLogin);
  document.getElementById('gPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') fazerLogin(); });
}
async function fazerLogin() {
  const email = document.getElementById('gEmail').value.trim();
  const senha = document.getElementById('gPass').value;
  const erroEl = document.getElementById('gateError');
  const btn = document.getElementById('btnEntrar');
  erroEl.textContent = '';
  btn.disabled = true; btn.textContent = 'Entrando...';
  const r = await signIn(email, senha);
  btn.disabled = false; btn.textContent = 'Entrar';
  if (!r.ok) { erroEl.textContent = r.erro; return; }
  entrar();
}
function entrar() {
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('app').classList.add('on');
  aplicarSessao();
  irPara('painel');
}

// ---------- SESSAO E PERMISSOES ----------
function aplicarSessao() {
  const u = currentUser();
  document.getElementById('userAv').textContent = u.iniciais;
  document.getElementById('userWho').childNodes[0].nodeValue = u.nome;
  document.getElementById('userRole').textContent = u.papel === 'admin' ? 'Administrador' : 'Consultor';

  document.querySelectorAll('.nav-item').forEach((n) => {
    const perm = n.dataset.perm;
    const soAdmin = n.dataset.admin === 'true';
    let ok = true;
    if (soAdmin) ok = isAdmin();
    else if (perm) ok = can(perm);
    n.hidden = !ok;
  });
  document.querySelectorAll('.nav-label[data-admin="true"]').forEach((l) => (l.hidden = !isAdmin()));

  renderTudo();
}

function renderTudo() {
  R.renderDashboard();
  R.renderProps(filtroImoveis);
  R.renderBoard(mostrarArquivados);
  R.renderVitrine();
  if (isAdmin()) R.renderUsuarios();
  if (can('financeiro')) R.renderFinanceiro();
}

// ---------- NAVEGACAO ----------
function wireNav() {
  document.getElementById('nav').addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (item && !item.hidden) irPara(item.dataset.view);
  });
  document.body.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) irPara(g.dataset.goto);
  });
  // Filtro de consultor do painel.
  document.getElementById('dashScope').addEventListener('change', (e) => {
    if (e.target.id === 'dashSelect') { R.setDashScope(e.target.value); R.renderDashboard(); }
  });
}
function irPara(view) {
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => (v.hidden = true));
  const el = document.getElementById('v-' + view);
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetHeight; el.style.animation = '';
  document.getElementById('crumb').textContent = titles[view][0];
  document.getElementById('pageTitle').textContent = titles[view][1];
  fecharMenu();
}

// ---------- MOBILE ----------
function wireMobile() {
  const side = document.getElementById('side');
  const overlay = document.getElementById('sideOverlay');
  document.getElementById('hamburger').addEventListener('click', () => {
    side.classList.add('open'); overlay.classList.add('on');
  });
  overlay.addEventListener('click', fecharMenu);
}
function fecharMenu() {
  document.getElementById('side').classList.remove('open');
  document.getElementById('sideOverlay').classList.remove('on');
}

// ---------- IMOVEIS ----------
function wireImoveis() {
  document.getElementById('propFilters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filtroImoveis = chip.dataset.f;
    document.querySelectorAll('#propFilters .chip').forEach((c) => c.classList.remove('on'));
    chip.classList.add('on');
    R.renderProps(filtroImoveis);
  });

  // Abrir detalhe.
  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.prop');
    if (!card) return;
    const im = state.imoveis.find((i) => String(i.id) === String(card.dataset.id));
    if (im) { document.getElementById('detailModal').innerHTML = R.detailHtml(im); abrir('detailBg'); }
  });

  document.getElementById('btnNovoImovel').addEventListener('click', () => abrirFormImovel(null));

  // Editar e excluir dentro do detalhe.
  document.body.addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const im = state.imoveis.find((i) => String(i.id) === String(ed.dataset.edit));
      if (im && canManageImovel(im)) { fechar(); abrirFormImovel(im); }
    }
    const del = e.target.closest('[data-del-imovel]');
    if (del) {
      const im = state.imoveis.find((i) => String(i.id) === String(del.dataset.delImovel));
      if (im && canManageImovel(im)) confirmar('Excluir imovel', `Remover "${im.titulo}" da carteira? Esta acao nao pode ser desfeita.`, async () => {
        await deleteImovel(im.id); fechar(); renderTudo();
      });
    }
  });
}

function abrirFormImovel(im) {
  formFotos = im && im.fotos ? im.fotos.slice() : [];
  document.getElementById('imovelModal').innerHTML = R.imovelFormHtml(im);
  renderThumbs();
  abrir('imovelBg');

  const uploader = document.getElementById('uploader');
  const fileInput = document.getElementById('fileInput');
  uploader.addEventListener('click', () => fileInput.click());
  uploader.addEventListener('dragover', (e) => { e.preventDefault(); uploader.style.borderColor = 'var(--champagne)'; });
  uploader.addEventListener('dragleave', () => { uploader.style.borderColor = ''; });
  uploader.addEventListener('drop', async (e) => { e.preventDefault(); uploader.style.borderColor = ''; await adicionarFotos(e.dataTransfer.files); });
  fileInput.addEventListener('change', async (e) => { await adicionarFotos(e.target.files); e.target.value = ''; });

  document.getElementById('thumbs').addEventListener('click', (e) => {
    const x = e.target.closest('[data-rm]');
    if (x) { formFotos.splice(Number(x.dataset.rm), 1); renderThumbs(); }
  });

  document.getElementById('btnSalvarImovel').addEventListener('click', salvarImovel);
}

async function adicionarFotos(files) {
  const lidas = await Promise.all([...files].filter((f) => f.type.startsWith('image/')).map(lerArquivo));
  formFotos = formFotos.concat(lidas);
  renderThumbs();
}
function lerArquivo(file) {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
}
function renderThumbs() {
  const box = document.getElementById('thumbs');
  if (!box) return;
  box.innerHTML = formFotos.map((f, idx) => `<div class="thumb"><img src="${f}" alt="foto"><div class="tx" data-rm="${idx}">&times;</div></div>`).join('');
}

async function salvarImovel() {
  const val = (id) => document.getElementById(id).value;
  const idExistente = document.getElementById('btnSalvarImovel').dataset.id;
  const u = currentUser();
  const base = {
    titulo: val('fTitulo').trim() || 'Novo imovel',
    tipo: val('fTipo'),
    finalidade: val('fFin'),
    bairro: val('fBairro').trim() || 'Uberlandia',
    cidade: 'Uberlandia',
    valor: Number(val('fValor')) || 0,
    status: val('fStatus'),
    quartos: Number(val('fQ')) || 0,
    banheiros: Number(val('fB')) || 0,
    vagas: Number(val('fV')) || 0,
    area: Number(val('fArea')) || 0,
    descricao: val('fDesc').trim(),
    destaque: document.getElementById('fDestaque').checked,
    publicado: document.getElementById('fPublicado').checked,
    fotos: formFotos.slice()
  };

  if (idExistente) {
    await updateImovel(idExistente, base);
  } else {
    await createImovel({ ...base, corretor: u.nome, corretor_id: u.id, cover: covers[Math.floor(Math.random() * covers.length)] });
  }
  fechar();
  irPara('imoveis');
  filtroImoveis = 'todos';
  document.querySelectorAll('#propFilters .chip').forEach((c) => c.classList.toggle('on', c.dataset.f === 'todos'));
  renderTudo();
}

// ---------- LEADS ----------
function wireLeads() {
  const board = document.getElementById('board');
  let dragId = null;

  board.addEventListener('dragstart', (e) => { const l = e.target.closest('.lead'); if (l) { dragId = l.dataset.id; l.classList.add('dragging'); } });
  board.addEventListener('dragend', (e) => { const l = e.target.closest('.lead'); if (l) l.classList.remove('dragging'); });
  board.addEventListener('dragover', (e) => { e.preventDefault(); const c = e.target.closest('.col'); if (c) c.classList.add('drag-over'); });
  board.addEventListener('dragleave', (e) => { const c = e.target.closest('.col'); if (c) c.classList.remove('drag-over'); });
  board.addEventListener('drop', async (e) => {
    e.preventDefault();
    const c = e.target.closest('.col'); if (!c) return;
    c.classList.remove('drag-over');
    const l = state.leads.find((x) => String(x.id) === String(dragId));
    if (!l || l.etapa === c.dataset.etapa) return;
    await updateLeadEtapa(l.id, c.dataset.etapa);
    R.renderBoard(mostrarArquivados); R.renderDashboard();
  });

  // Abrir lead (clique que nao seja arrasto).
  board.addEventListener('click', (e) => {
    const l = e.target.closest('.lead');
    if (!l) return;
    const lead = state.leads.find((x) => String(x.id) === String(l.dataset.id));
    if (lead) abrirLead(lead);
  });

  document.getElementById('toggleArquivados').addEventListener('click', (e) => {
    mostrarArquivados = !mostrarArquivados;
    e.target.classList.toggle('on', mostrarArquivados);
    e.target.textContent = mostrarArquivados ? 'Ver ativos' : 'Ver arquivados';
    R.renderBoard(mostrarArquivados);
  });

  // Acoes dentro do modal de lead.
  document.body.addEventListener('click', async (e) => {
    const et = e.target.closest('[data-etapa][data-lead]');
    if (et) {
      await updateLeadEtapa(et.dataset.lead, et.dataset.etapa);
      const lead = state.leads.find((x) => String(x.id) === String(et.dataset.lead));
      abrirLead(lead); R.renderBoard(mostrarArquivados); R.renderDashboard();
    }
    const add = e.target.closest('[data-add-obs]');
    if (add) {
      const texto = document.getElementById('obsInput').value.trim();
      if (texto) {
        await addLeadObs(add.dataset.addObs, texto, currentUser().nome);
        const lead = state.leads.find((x) => String(x.id) === String(add.dataset.addObs));
        abrirLead(lead); R.renderBoard(mostrarArquivados);
      }
    }
    const arq = e.target.closest('[data-arquivar]');
    if (arq) {
      await toggleArquivarLead(arq.dataset.arquivar);
      fechar(); R.renderBoard(mostrarArquivados); R.renderDashboard();
    }
    const dl = e.target.closest('[data-del-lead]');
    if (dl) {
      const lead = state.leads.find((x) => String(x.id) === String(dl.dataset.delLead));
      confirmar('Excluir lead', `Remover o lead de "${lead.nome}"? Esta acao nao pode ser desfeita.`, async () => {
        await deleteLead(dl.dataset.delLead); fechar(); R.renderBoard(mostrarArquivados); R.renderDashboard();
      });
    }
  });
}
function abrirLead(lead) {
  document.getElementById('leadModal').innerHTML = R.leadModalHtml(lead);
  abrir('leadBg');
}

// ---------- USUARIOS ----------
function wireUsuarios() {
  document.getElementById('btnNovoUsuario').addEventListener('click', () => {
    document.getElementById('usuarioModal').innerHTML = R.usuarioFormHtml();
    abrir('usuarioBg');
    document.getElementById('btnSalvarUsuario').addEventListener('click', salvarUsuario);
  });

  document.getElementById('usuariosList').addEventListener('click', async (e) => {
    const perm = e.target.closest('[data-perm-user]');
    if (perm) {
      const u = state.usuarios.find((x) => x.id === perm.dataset.permUser);
      const area = perm.dataset.permArea;
      u.permissoes[area] = !u.permissoes[area];
      await updateUsuario(u.id, { permissoes: u.permissoes });
      R.renderUsuarios();
      if (u.id === currentUser().id) aplicarSessao();
      return;
    }
    const ativo = e.target.closest('[data-ativo-user]');
    if (ativo) {
      const u = state.usuarios.find((x) => x.id === ativo.dataset.ativoUser);
      await updateUsuario(u.id, { ativo: !u.ativo });
      R.renderUsuarios();
      return;
    }
    const del = e.target.closest('[data-del-user]');
    if (del) {
      const u = state.usuarios.find((x) => x.id === del.dataset.delUser);
      confirmar('Remover usuario', `Remover o acesso de "${u.nome}"?`, async () => {
        await deleteUsuario(u.id); R.renderUsuarios(); montarActing();
      });
    }
  });
}
async function salvarUsuario() {
  const nome = document.getElementById('uNome').value.trim();
  const email = document.getElementById('uEmail').value.trim();
  const papel = document.getElementById('uPapel').value;
  if (!nome || !email) return;
  const iniciais = nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  await createUsuario({ nome, email, papel, iniciais });
  fechar(); R.renderUsuarios(); montarActing();
}

// ---------- FINANCEIRO ----------
function wireFinanceiro() {
  const cont = document.getElementById('finContent');
  cont.addEventListener('change', (e) => {
    if (e.target.id === 'finPeriodo') { R.setFinPeriodo(e.target.value); R.renderFinanceiro(); }
    if (e.target.id === 'finConsultor') { R.setFinConsultor(e.target.value); R.renderFinanceiro(); }
  });
  cont.addEventListener('click', async (e) => {
    if (e.target.id === 'btnNovoLancamento') {
      document.getElementById('transacaoModal').innerHTML = R.transacaoFormHtml();
      abrir('transacaoBg');
      document.getElementById('btnSalvarTransacao').addEventListener('click', salvarTransacao);
      return;
    }
    const pg = e.target.closest('[data-pagar]');
    if (pg) { await updateTransacao(pg.dataset.pagar, { status: 'pago' }); R.renderFinanceiro(); }
  });
}
async function salvarTransacao() {
  const val = (id) => document.getElementById(id).value;
  const dados = {
    tipo: val('tTipo'),
    data: val('tData') || new Date().toISOString().slice(0, 10),
    descricao: val('tDesc').trim() || 'Lancamento',
    consultor_id: val('tCons') || null,
    valor: Number(val('tValor')) || 0,
    venda: Number(val('tVenda')) || 0,
    status: val('tTipo') === 'despesa' ? 'pago' : val('tStatus')
  };
  await createTransacao(dados);
  fechar(); R.renderFinanceiro();
}

// ---------- MODAIS ----------
function wireModaisGlobais() {
  document.querySelectorAll('.modal-bg').forEach((bg) => {
    bg.addEventListener('click', (e) => { if (e.target === bg) fechar(); });
  });
  document.body.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
}
function abrir(id) { document.getElementById(id).classList.add('on'); }
function fechar() { document.querySelectorAll('.modal-bg').forEach((m) => m.classList.remove('on')); }

let confirmCb = null;
function confirmar(titulo, texto, cb) {
  confirmCb = cb;
  document.getElementById('confirmModal').innerHTML = R.confirmHtml(titulo, texto);
  abrir('confirmBg');
  document.getElementById('confirmOk').addEventListener('click', async () => { const fn = confirmCb; confirmCb = null; if (fn) await fn(); });
}

// ---------- BUSCA ----------
function wireSearch() {
  document.getElementById('globalSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    if (!document.getElementById('v-imoveis').hidden || q) {
      if (q && can('imoveis')) irPara('imoveis');
      const list = state.imoveis.filter((i) =>
        i.titulo.toLowerCase().includes(q) || i.bairro.toLowerCase().includes(q) || i.tipo.toLowerCase().includes(q));
      document.getElementById('propGrid').innerHTML = list.length
        ? list.map(R.propCard).join('') : '<div class="empty"><p>Nada encontrado para esta busca.</p></div>';
    }
  });
}

// ---------- VER COMO (DEMONSTRACAO) ----------
function wireActing() {
  montarActing();
  document.getElementById('actingSelect').addEventListener('change', (e) => {
    setActingUser(e.target.value);
    R.setDashScope('todos');
    aplicarSessao();
    irPara('painel');
  });
}
function montarActing() {
  const sel = document.getElementById('actingSelect');
  sel.innerHTML = state.usuarios.map((u) => `<option value="${u.id}" ${u.id === state.actingUserId ? 'selected' : ''}>${u.nome} (${u.papel === 'admin' ? 'Admin' : 'Consultor'})</option>`).join('');
}

// ---------- SAIR ----------
function wireLogout() {
  document.getElementById('btnLogout').addEventListener('click', async () => { await signOut(); location.reload(); });
}

// ---------- BADGE ----------
function mostrarBadge() {
  const badge = document.createElement('div');
  badge.className = 'env-badge';
  badge.innerHTML = isSupabaseConfigured
    ? '<span class="dot" style="background:#8bb489"></span>Supabase conectado'
    : '<span class="dot" style="background:#d2a860"></span>Modo demonstracao';
  document.body.appendChild(badge);
}

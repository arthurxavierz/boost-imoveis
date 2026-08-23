// Funcoes que desenham a interface a partir do estado.

import { brl, brlShort, statusMap, etapas, icons } from '../lib/format.js';
import { state } from '../data/state.js';
import { currentUser, isAdmin, canManageImovel } from '../lib/session.js';

const consultores = () => state.usuarios.filter((u) => u.papel === 'consultor');
const nomeConsultor = (id) => (state.usuarios.find((u) => u.id === id) || {}).nome || 'Sem consultor';

// Escopo do painel: 'todos' ou um id de consultor.
let dashScope = 'todos';
export const getDashScope = () => dashScope;
export const setDashScope = (v) => (dashScope = v);

// ---------- CARTAO DE IMOVEL ----------
export function propCard(i) {
  const st = statusMap[i.status] || statusMap.disponivel;
  const temFoto = i.fotos && i.fotos.length;
  const coverStyle = temFoto ? `style="background-image:url(${i.fotos[0]})"` : '';
  const coverClass = temFoto ? '' : i.cover;
  const specs = i.tipo === 'Terreno'
    ? `<div class="spec">${icons.area}${i.area} m2</div>`
    : `${i.quartos > 0 ? `<div class="spec">${icons.bed}${i.quartos}</div>` : ''}` +
      `<div class="spec">${icons.bath}${i.banheiros}</div>` +
      `${i.vagas > 0 ? `<div class="spec">${icons.car}${i.vagas}</div>` : ''}` +
      `<div class="spec">${icons.area}${i.area} m2</div>`;

  return `<article class="prop" data-id="${i.id}">
    <div class="prop-cover ${coverClass}" ${coverStyle}>
      <div class="badge"><span class="dot ${st.dot}"></span>${st.lab}</div>
      ${i.destaque ? '<div class="star">Destaque</div>' : ''}
      <div class="fin">${i.finalidade}</div>
      ${temFoto ? `<div class="nfotos">${icons.image}${i.fotos.length}</div>` : ''}
    </div>
    <div class="prop-body">
      <div class="tp">${i.tipo}</div>
      <h4>${i.titulo}</h4>
      <div class="loc">${icons.pin}${i.bairro}, ${i.cidade}</div>
      <div class="specs">${specs}</div>
      <div class="prop-foot">
        <div class="price"><small>${i.finalidade === 'Locacao' ? 'Locacao' : 'Valor'}</small>${brl(i.valor)}</div>
        <div class="cor">Consultor<b>${i.corretor}</b></div>
      </div>
    </div>
  </article>`;
}

// ---------- CARTAO DE LEAD ----------
export function leadCard(l) {
  const nObs = (l.observacoes && l.observacoes.length) || 0;
  return `<div class="lead ${l.arquivado ? 'arq' : ''}" draggable="true" data-id="${l.id}">
    <div class="ln">${l.nome}</div>
    <div class="li">${l.imovel}</div>
    <div class="lv">${brlShort(l.valor)}</div>
    <div class="lf">
      <span class="org">${l.origem}</span>
      <span class="lright">
        ${nObs ? `<span class="obs">${icons.note}${nObs}</span>` : ''}
        <span class="lc">${l.iniciais}</span>
      </span>
    </div>
  </div>`;
}

// ---------- PAINEL ----------
export function renderDashboard() {
  const admin = isAdmin();
  const scope = admin ? dashScope : currentUser().id;

  // Filtro de consultor (so admin).
  const scopeEl = document.getElementById('dashScope');
  if (admin) {
    const opts = ['<option value="todos">Toda a equipe</option>']
      .concat(consultores().map((c) => `<option value="${c.id}" ${scope === c.id ? 'selected' : ''}>${c.nome}</option>`))
      .join('');
    scopeEl.innerHTML = `<div class="dash-scope"><span class="lbl">Desempenho de</span><select id="dashSelect">${opts}</select></div>`;
  } else {
    scopeEl.innerHTML = '';
  }

  const imoveis = scope === 'todos' ? state.imoveis : state.imoveis.filter((i) => i.corretor_id === scope);
  const leads = (scope === 'todos' ? state.leads : state.leads.filter((l) => l.consultor_id === scope)).filter((l) => !l.arquivado);

  const ativos = imoveis.filter((i) => i.status === 'disponivel');
  const vendidos = imoveis.filter((i) => i.status === 'vendido');
  const vgv = ativos.reduce((s, i) => s + Number(i.valor), 0);
  const fechados = leads.filter((l) => l.etapa === 'fechado').length;

  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi feature"><div class="lab">VGV em carteira</div><div class="val">${brlShort(vgv)}</div><div class="sub">Valor dos imoveis ativos${scope === 'todos' ? '. <b>+3 lancamentos</b> este mes' : ''}</div></div>
    <div class="kpi"><div class="lab">Imoveis ativos</div><div class="val">${ativos.length}</div><div class="sub">Disponiveis na carteira</div></div>
    <div class="kpi"><div class="lab">Vendidos</div><div class="val">${vendidos.length}</div><div class="sub">Negocios concluidos</div></div>
    <div class="kpi"><div class="lab">Leads no funil</div><div class="val">${leads.length}</div><div class="sub"><b>${fechados}</b> fechados</div></div>`;

  renderFunnel(leads);

  // Tabela de desempenho por consultor (so admin).
  const perfEl = document.getElementById('dashPerf');
  if (admin) {
    const linhas = consultores().map((c) => {
      const im = state.imoveis.filter((i) => i.corretor_id === c.id);
      const ld = state.leads.filter((l) => l.consultor_id === c.id && !l.arquivado);
      const at = im.filter((i) => i.status === 'disponivel').length;
      const re = im.filter((i) => i.status === 'reservado').length;
      const ve = im.filter((i) => i.status === 'vendido').length;
      const vgvC = im.filter((i) => i.status === 'disponivel').reduce((s, i) => s + Number(i.valor), 0);
      const fe = ld.filter((l) => l.etapa === 'fechado').length;
      return `<tr>
        <td><div class="who-cell"><span class="mini">${c.iniciais}</span>${c.nome}</div></td>
        <td class="r">${at}</td><td class="r">${re}</td><td class="r">${ve}</td>
        <td class="r gold">${brlShort(vgvC)}</td>
        <td class="r">${ld.length}</td><td class="r">${fe}</td>
      </tr>`;
    }).join('');
    perfEl.innerHTML = `<div class="card perf">
      <div class="card-h"><h3>Desempenho por consultor</h3></div>
      <div style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Consultor</th><th class="r">Ativos</th><th class="r">Reservados</th><th class="r">Vendidos</th><th class="r">VGV ativo</th><th class="r">Leads</th><th class="r">Fechados</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table></div>
    </div>`;
  } else {
    perfEl.innerHTML = '';
  }
}

function renderFunnel(leads) {
  const max = Math.max(...etapas.map((e) => leads.filter((l) => l.etapa === e.k).length), 1);
  document.getElementById('funnel').innerHTML = etapas.map((e) => {
    const n = leads.filter((l) => l.etapa === e.k).length;
    return `<div class="fn-row"><div class="fn-lab">${e.n}</div><div class="fn-bar"><i style="width:${(n / max) * 100}%"></i></div><div class="fn-n">${n}</div></div>`;
  }).join('');
}

// ---------- IMOVEIS ----------
export function renderProps(filtro) {
  const list = filtro === 'todos' ? state.imoveis : state.imoveis.filter((i) => i.status === filtro);
  const grid = document.getElementById('propGrid');
  grid.innerHTML = list.length ? list.map(propCard).join('') : '<div class="empty"><p>Nenhum imovel neste status.</p></div>';
}

// ---------- LEADS ----------
export function renderBoard(mostrarArquivados) {
  const board = document.getElementById('board');
  board.innerHTML = etapas.map((e) => {
    const items = state.leads.filter((l) => l.etapa === e.k && (mostrarArquivados ? l.arquivado : !l.arquivado));
    return `<div class="col" data-etapa="${e.k}">
      <div class="col-h"><span class="nm">${e.n}</span><span class="bar"></span><span class="ct">${items.length}</span></div>
      ${items.map(leadCard).join('')}
    </div>`;
  }).join('');
}

// ---------- VITRINE ----------
export function renderVitrine() {
  const pub = state.imoveis.filter((i) => i.publicado && i.status === 'disponivel');
  document.getElementById('vitGrid').innerHTML = pub.map(propCard).join('');
  document.getElementById('vitCount').textContent = pub.length + ' imoveis';
}

// ---------- DETALHE DO IMOVEL ----------
export function detailHtml(i) {
  const temFoto = i.fotos && i.fotos.length;
  const coverStyle = temFoto ? `style="background-image:url(${i.fotos[0]})"` : '';
  const coverClass = temFoto ? '' : i.cover;
  const specData = i.tipo === 'Terreno'
    ? [['Area', i.area + ' m2']]
    : [['Quartos', i.quartos || '-'], ['Banheiros', i.banheiros], ['Vagas', i.vagas || '-'], ['Area', i.area + ' m2']];
  const galeria = temFoto
    ? `<div class="mgallery">${i.fotos.map((f) => `<img src="${f}" alt="Foto do imovel">`).join('')}</div>`
    : '';
  const podeGerir = canManageImovel(i);
  const botoesGestao = podeGerir
    ? `<button class="btn-sm" data-edit="${i.id}">Editar</button><button class="btn-danger" data-del-imovel="${i.id}">Excluir</button>`
    : '';

  return `
    <div class="modal-cover ${coverClass}" ${coverStyle}>
      <button class="x" data-close>&times;</button>
    </div>
    <div class="modal-body">
      <div class="tp">${i.tipo} &middot; ${i.finalidade}</div>
      <h3>${i.titulo}</h3>
      <div class="mloc">${icons.pin}${i.bairro}, ${i.cidade} - MG</div>
      ${galeria}
      <div class="mspecs">${specData.map((s) => `<div class="mspec"><div class="mn">${s[1]}</div><div class="ml">${s[0]}</div></div>`).join('')}</div>
      <p class="mdesc">${i.descricao || 'Sem descricao cadastrada.'}</p>
      <div class="mowner">Cadastrado por ${i.corretor}${podeGerir ? '' : '. Somente o responsavel ou o administrador pode editar.'}</div>
      <div class="mfoot">
        <div class="mprice"><small>${i.finalidade === 'Locacao' ? 'Locacao mensal' : 'Valor de venda'}</small>${brl(i.valor)}</div>
        <div class="mbtns">${botoesGestao}</div>
      </div>
    </div>`;
}

// ---------- FORMULARIO DE IMOVEL (novo e edicao) ----------
export function imovelFormHtml(im) {
  const editando = Boolean(im);
  const g = (v, d = '') => (v === undefined || v === null ? d : v);
  const opt = (val, sel) => `<option ${val === sel ? 'selected' : ''}>${val}</option>`;
  return `
    <h3>${editando ? 'Editar imovel' : 'Novo imovel'}</h3>
    <div class="fsub">${editando ? 'Atualize as informacoes e a galeria de fotos.' : 'Cadastre um imovel na carteira da Boost.'}</div>
    <div class="frow"><div class="fg full"><label>Titulo</label><input id="fTitulo" value="${g(im?.titulo)}" placeholder="Cobertura Duplex Morada da Colina"></div></div>
    <div class="frow">
      <div class="fg"><label>Tipo</label><select id="fTipo">${['Cobertura','Apartamento','Casa','Sala comercial','Studio','Terreno'].map((v) => opt(v, im?.tipo)).join('')}</select></div>
      <div class="fg"><label>Finalidade</label><select id="fFin">${['Venda','Locacao'].map((v) => opt(v, im?.finalidade)).join('')}</select></div>
    </div>
    <div class="frow">
      <div class="fg"><label>Bairro</label><input id="fBairro" value="${g(im?.bairro)}" placeholder="Morada da Colina"></div>
      <div class="fg"><label>Valor (R$)</label><input id="fValor" type="number" value="${g(im?.valor, '')}" placeholder="2850000"></div>
    </div>
    <div class="frow three">
      <div class="fg"><label>Quartos</label><input id="fQ" type="number" value="${g(im?.quartos, '')}" placeholder="4"></div>
      <div class="fg"><label>Banheiros</label><input id="fB" type="number" value="${g(im?.banheiros, '')}" placeholder="3"></div>
      <div class="fg"><label>Vagas</label><input id="fV" type="number" value="${g(im?.vagas, '')}" placeholder="2"></div>
    </div>
    <div class="frow">
      <div class="fg"><label>Area (m2)</label><input id="fArea" type="number" value="${g(im?.area, '')}" placeholder="210"></div>
      <div class="fg"><label>Status</label><select id="fStatus">${[['disponivel','Disponivel'],['reservado','Reservado'],['vendido','Vendido'],['locado','Locado']].map(([v, l]) => `<option value="${v}" ${im?.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="frow"><div class="fg full"><label>Descricao</label><textarea id="fDesc" placeholder="Detalhes do imovel">${g(im?.descricao)}</textarea></div></div>
    <div class="fcheck">
      <label><input type="checkbox" id="fDestaque" ${im?.destaque ? 'checked' : ''}>Destaque</label>
      <label><input type="checkbox" id="fPublicado" ${im?.publicado ? 'checked' : ''}>Publicar na vitrine</label>
    </div>
    <div class="fg full">
      <label>Galeria de fotos</label>
      <div class="uploader" id="uploader"><span><b>Escolher imagens</b> ou arraste aqui</span></div>
      <input type="file" id="fileInput" accept="image/*" multiple hidden>
      <div class="thumbs" id="thumbs"></div>
    </div>
    <div class="form-actions">
      <button class="btn-gold" id="btnSalvarImovel" data-id="${g(im?.id, '')}">${editando ? 'Salvar alteracoes' : 'Salvar imovel'}</button>
      <button class="btn-ghost" data-close>Cancelar</button>
    </div>`;
}

// ---------- MODAL DE LEAD ----------
export function leadModalHtml(l) {
  const obs = (l.observacoes && l.observacoes.length)
    ? l.observacoes.map((o) => `<div class="obs"><div class="ot">${o.texto}</div><div class="om">${o.autor} &middot; ${formatarData(o.data)}</div></div>`).join('')
    : '<div class="obs-empty">Nenhuma observacao ainda.</div>';
  const chips = etapas.map((e) => `<button class="lm-etapa ${l.etapa === e.k ? 'on' : ''}" data-etapa="${e.k}" data-lead="${l.id}">${e.n}</button>`).join('');
  return `
    <div class="lead-modal">
      <div class="lm-h">
        <div>
          <h3>${l.nome}</h3>
          <div class="lm-sub">${l.imovel} &middot; ${brl(l.valor)}</div>
          <div class="lm-sub">${l.telefone || 'Sem telefone'} &middot; Origem: ${l.origem} &middot; ${nomeConsultor(l.consultor_id)}</div>
        </div>
        <button class="x" data-close style="position:static">&times;</button>
      </div>
      <div class="lm-sec">Etapa do funil</div>
      <div class="lm-etapas">${chips}</div>
      <div class="lm-sec">Observacoes</div>
      <div class="obs-list">${obs}</div>
      <div class="obs-add">
        <textarea id="obsInput" placeholder="Escreva uma observacao"></textarea>
        <button class="btn-gold" style="width:auto;margin:0;padding:0 20px" data-add-obs="${l.id}">Anotar</button>
      </div>
      <div class="lm-foot">
        <button class="btn-sm" data-arquivar="${l.id}">${l.arquivado ? 'Desarquivar' : 'Arquivar'}</button>
        <div class="spacer"></div>
        <button class="btn-danger" data-del-lead="${l.id}">Excluir lead</button>
      </div>
    </div>`;
}

// ---------- USUARIOS ----------
export function renderUsuarios() {
  const areas = [
    ['imoveis', 'Imoveis', 'Cadastrar e gerir a carteira'],
    ['leads', 'Leads', 'Acompanhar o funil de vendas'],
    ['financeiro', 'Financeiro', 'Ver receitas, comissoes e despesas'],
    ['usuarios', 'Usuarios', 'Gerir acessos da equipe']
  ];
  document.getElementById('usuariosList').innerHTML = `<div class="users">` + state.usuarios.map((u) => {
    const admin = u.papel === 'admin';
    const perms = areas.map(([k, nome, desc]) => {
      const ligado = admin || (u.permissoes && u.permissoes[k]);
      return `<div class="perm-row">
        <div class="pl">${nome}<small>${desc}</small></div>
        <div class="switch ${ligado ? 'on' : ''} ${admin ? 'locked' : ''}" ${admin ? '' : `data-perm-user="${u.id}" data-perm-area="${k}"`}></div>
      </div>`;
    }).join('');
    return `<div class="ucard">
      <div class="ucard-h">
        <div class="uav">${u.iniciais}</div>
        <div class="uinfo"><div class="un">${u.nome}</div><div class="ue">${u.email}</div></div>
        <div class="utag ${admin ? 'admin' : 'consultor'}">${admin ? 'Admin' : 'Consultor'}</div>
      </div>
      <div class="uperms">${perms}</div>
      <div class="ucard-foot">
        <div class="ustatus"><div class="switch ${u.ativo ? 'on' : ''}" data-ativo-user="${u.id}"></div>${u.ativo ? 'Acesso ativo' : 'Acesso suspenso'}</div>
        <div class="uactions">${admin ? '' : `<button class="btn-danger" data-del-user="${u.id}">Remover</button>`}</div>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

export function usuarioFormHtml() {
  return `
    <h3>Novo usuario</h3>
    <div class="fsub">Crie um acesso para a equipe da Boost.</div>
    <div class="frow"><div class="fg full"><label>Nome</label><input id="uNome" placeholder="Nome completo"></div></div>
    <div class="frow"><div class="fg full"><label>E-mail</label><input id="uEmail" type="email" placeholder="nome@boostimoveis.com.br"></div></div>
    <div class="frow">
      <div class="fg"><label>Perfil</label><select id="uPapel"><option value="consultor">Consultor</option><option value="admin">Administrador</option></select></div>
      <div class="fg"><label>Senha inicial</label><input id="uSenha" type="password" placeholder="Senha provisoria"></div>
    </div>
    <div class="form-actions">
      <button class="btn-gold" id="btnSalvarUsuario">Criar acesso</button>
      <button class="btn-ghost" data-close>Cancelar</button>
    </div>`;
}

// ---------- FINANCEIRO ----------
let finPeriodo = 'ano';
let finConsultor = 'todos';
export const getFinFiltros = () => ({ periodo: finPeriodo, consultor: finConsultor });
export const setFinPeriodo = (v) => (finPeriodo = v);
export const setFinConsultor = (v) => (finConsultor = v);

export function renderFinanceiro() {
  let tx = state.transacoes.slice();
  const agora = new Date();
  if (finPeriodo === 'ano') tx = tx.filter((t) => t.data.slice(0, 4) === String(agora.getFullYear()));
  if (finPeriodo === 'mes') tx = tx.filter((t) => t.data.slice(0, 7) === agora.toISOString().slice(0, 7));
  if (finConsultor !== 'todos') tx = tx.filter((t) => t.consultor_id === finConsultor);

  const comissoes = tx.filter((t) => t.tipo === 'comissao');
  const despesas = tx.filter((t) => t.tipo === 'despesa');
  const realizada = comissoes.filter((t) => t.status === 'pago').reduce((s, t) => s + Number(t.valor), 0);
  const pendente = comissoes.filter((t) => t.status === 'pendente').reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.valor), 0);
  const vgvVendido = comissoes.reduce((s, t) => s + Number(t.venda || 0), 0);
  const resultado = realizada - totalDespesas;

  const optCons = ['<option value="todos">Todos os consultores</option>']
    .concat(consultores().map((c) => `<option value="${c.id}" ${finConsultor === c.id ? 'selected' : ''}>${c.nome}</option>`)).join('');
  const optPer = [['ano', 'Este ano'], ['mes', 'Este mes'], ['tudo', 'Tudo']]
    .map(([v, l]) => `<option value="${v}" ${finPeriodo === v ? 'selected' : ''}>${l}</option>`).join('');

  // Faturamento por mes.
  const porMes = {};
  comissoes.forEach((t) => { const m = t.data.slice(0, 7); porMes[m] = (porMes[m] || 0) + Number(t.valor); });
  const meses = Object.keys(porMes).sort();
  const maxMes = Math.max(...Object.values(porMes), 1);
  const chart = meses.length ? meses.map((m) => {
    const h = (porMes[m] / maxMes) * 100;
    return `<div class="bar-col"><div class="bval">${brlShort(porMes[m])}</div><div class="bar" style="height:${h}%"></div><div class="bmes">${rotuloMes(m)}</div></div>`;
  }).join('') : '<div class="obs-empty">Sem receitas no periodo.</div>';

  // Comissao por consultor.
  const porCons = {};
  comissoes.forEach((t) => { if (t.consultor_id) porCons[t.consultor_id] = (porCons[t.consultor_id] || 0) + Number(t.valor); });
  const maxCons = Math.max(...Object.values(porCons), 1);
  const brk = Object.keys(porCons).length ? Object.keys(porCons).sort((a, b) => porCons[b] - porCons[a]).map((id) => {
    return `<div class="brk-row"><div class="brk-top"><span class="bn">${nomeConsultor(id)}</span><span class="bv">${brlShort(porCons[id])}</span></div><div class="brk-bar"><i style="width:${(porCons[id] / maxCons) * 100}%"></i></div></div>`;
  }).join('') : '<div class="obs-empty">Sem comissoes no periodo.</div>';

  // Tabela de lancamentos.
  const linhas = tx.slice().sort((a, b) => b.data.localeCompare(a.data)).map((t) => {
    const isDesp = t.tipo === 'despesa';
    const pill = isDesp ? '<span class="pill desp">Despesa</span>' : `<span class="pill ${t.status}">${t.status === 'pago' ? 'Pago' : 'Pendente'}</span>`;
    const acao = (!isDesp && t.status === 'pendente') ? `<button class="btn-sm" data-pagar="${t.id}">Marcar pago</button>` : '';
    return `<tr>
      <td>${formatarData(t.data)}</td>
      <td>${t.descricao}</td>
      <td>${t.consultor_id ? nomeConsultor(t.consultor_id) : '-'}</td>
      <td class="r ${isDesp ? '' : 'gold'}">${isDesp ? '- ' : ''}${brl(t.valor)}</td>
      <td class="r">${pill}</td>
      <td class="r">${acao}</td>
    </tr>`;
  }).join('');

  document.getElementById('finContent').innerHTML = `
    <div class="fin-toolbar">
      <select id="finPeriodo">${optPer}</select>
      <select id="finConsultor">${optCons}</select>
      <div class="spacer" style="flex:1"></div>
      <button class="btn-add" id="btnNovoLancamento"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Novo lancamento</button>
    </div>
    <div class="fin-kpis">
      <div class="kpi feature"><div class="lab">Receita realizada</div><div class="val">${brlShort(realizada)}</div><div class="sub">Comissoes recebidas</div></div>
      <div class="kpi"><div class="lab">A receber</div><div class="val">${brlShort(pendente)}</div><div class="sub">Comissoes pendentes</div></div>
      <div class="kpi"><div class="lab">Despesas</div><div class="val">${brlShort(totalDespesas)}</div><div class="sub">Custos no periodo</div></div>
      <div class="kpi"><div class="lab">Resultado</div><div class="val" style="color:${resultado >= 0 ? 'var(--green)' : 'var(--danger)'}">${brlShort(resultado)}</div><div class="sub">VGV vendido: ${brlShort(vgvVendido)}</div></div>
    </div>
    <div class="fin-panels">
      <div class="card"><div class="card-h"><h3>Faturamento por mes</h3></div><div class="chart">${chart}</div></div>
      <div class="card"><div class="card-h"><h3>Comissao por consultor</h3></div><div class="brk">${brk}</div></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>Lancamentos</h3></div>
      <div style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Data</th><th>Descricao</th><th>Consultor</th><th class="r">Valor</th><th class="r">Situacao</th><th class="r"></th></tr></thead>
        <tbody>${linhas || '<tr><td colspan="6"><div class="obs-empty" style="margin:10px 0">Sem lancamentos.</div></td></tr>'}</tbody>
      </table></div>
    </div>`;
}

export function transacaoFormHtml() {
  const optCons = consultores().map((c) => `<option value="${c.id}">${c.nome}</option>`).join('');
  return `
    <h3>Novo lancamento</h3>
    <div class="fsub">Registre uma comissao (receita) ou uma despesa.</div>
    <div class="frow">
      <div class="fg"><label>Tipo</label><select id="tTipo"><option value="comissao">Comissao (receita)</option><option value="despesa">Despesa</option></select></div>
      <div class="fg"><label>Data</label><input id="tData" type="date"></div>
    </div>
    <div class="frow"><div class="fg full"><label>Descricao</label><input id="tDesc" placeholder="Venda Cobertura Santa Monica"></div></div>
    <div class="frow">
      <div class="fg"><label>Consultor</label><select id="tCons"><option value="">Nao se aplica</option>${optCons}</select></div>
      <div class="fg"><label>Valor (R$)</label><input id="tValor" type="number" placeholder="126000"></div>
    </div>
    <div class="frow">
      <div class="fg"><label>Valor da venda (opcional)</label><input id="tVenda" type="number" placeholder="2100000"></div>
      <div class="fg"><label>Situacao</label><select id="tStatus"><option value="pendente">Pendente</option><option value="pago">Pago</option></select></div>
    </div>
    <div class="form-actions">
      <button class="btn-gold" id="btnSalvarTransacao">Lancar</button>
      <button class="btn-ghost" data-close>Cancelar</button>
    </div>`;
}

// ---------- CONFIRMACAO ----------
export function confirmHtml(titulo, texto) {
  return `<h3>${titulo}</h3><p>${texto}</p><div class="cbtns"><button class="cno" data-close>Cancelar</button><button class="cok" id="confirmOk">Confirmar</button></div>`;
}

// ---------- AUXILIARES ----------
function formatarData(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}
function rotuloMes(ym) {
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const m = parseInt(ym.slice(5, 7), 10);
  return nomes[m - 1] || ym;
}

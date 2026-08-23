// Funcoes de formatacao e constantes visuais reutilizadas em todo o app.

export const brl = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR');

export const brlShort = (v) => {
  v = Number(v);
  if (v >= 1000000) return 'R$ ' + (v / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(0) + ' mil';
  return brl(v);
};

export const covers = ['cv1', 'cv2', 'cv3', 'cv4', 'cv5', 'cv6'];

export const statusMap = {
  disponivel: { lab: 'Disponivel', dot: 'dot-green' },
  reservado: { lab: 'Reservado', dot: 'dot-amber' },
  vendido: { lab: 'Vendido', dot: 'dot-ash' },
  locado: { lab: 'Locado', dot: 'dot-slate' }
};

export const etapas = [
  { k: 'novo', n: 'Novo' },
  { k: 'contato', n: 'Contato' },
  { k: 'visita', n: 'Visita' },
  { k: 'proposta', n: 'Proposta' },
  { k: 'fechado', n: 'Fechado' }
];

export const icons = {
  bed: '<svg viewBox="0 0 24 24"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  bath: '<svg viewBox="0 0 24 24"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2M5 19l-1 2M20 19l1 2"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M5 13l2-5h10l2 5M3 13h18v5H3zM6 18v2M18 18v2"/><circle cx="7.5" cy="15.5" r="1"/><circle cx="16.5" cy="15.5" r="1"/></svg>',
  area: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM3 9h18M9 3v18"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
};

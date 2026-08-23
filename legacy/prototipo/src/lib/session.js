// Sessao e permissoes. Decide quem pode ver e fazer o que.

import { state } from '../data/state.js';

export const currentUser = () =>
  state.usuarios.find((u) => u.id === state.actingUserId) || state.usuarios[0];

export const isAdmin = () => currentUser().papel === 'admin';

// Permissao para uma area (imoveis, leads, financeiro, usuarios).
export const can = (area) => {
  const u = currentUser();
  if (u.papel === 'admin') return true;
  return Boolean(u.permissoes && u.permissoes[area]);
};

// Regra de ouro do CRUD de imoveis: so o admin ou o dono edita e exclui.
export const canManageImovel = (imovel) => {
  const u = currentUser();
  return u.papel === 'admin' || imovel.corretor_id === u.id;
};

// Troca o usuario que opera o sistema (recurso do modo demonstracao,
// para validar as restricoes sem precisar de varios logins reais).
export const setActingUser = (id) => {
  state.actingUserId = id;
};

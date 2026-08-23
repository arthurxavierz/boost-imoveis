// Estado central do app em memoria. E a fonte unica de verdade enquanto
// o banco nao esta sincronizado. Quando o Supabase entrar, a camada
// store.js passa a ler e gravar la, mantendo este mesmo formato.

import { mockImoveis, mockLeads, mockUsuarios, mockTransacoes } from './mock.js';

const clone = (arr) => arr.map((x) => JSON.parse(JSON.stringify(x)));

export const state = {
  imoveis: clone(mockImoveis),
  leads: clone(mockLeads),
  usuarios: clone(mockUsuarios),
  transacoes: clone(mockTransacoes),
  // Usuario que esta operando o sistema. No modo demonstracao comeca
  // como admin para exibir todas as funcionalidades.
  actingUserId: 'u1'
};

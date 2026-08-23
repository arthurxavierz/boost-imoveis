// Camada de autenticacao.
//
// Com o Supabase configurado, faz login de verdade contra o Auth do
// Supabase. Sem configuracao, entra em modo demonstracao: qualquer
// e-mail e senha passam, para voce apresentar o sistema sem depender
// de nada.

import { supabase, isSupabaseConfigured } from './supabase.js';

export async function signIn(email, senha) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return { ok: false, erro: traduzErro(error.message) };
    return { ok: true, usuario: data.user };
  }
  // Modo demonstracao.
  return { ok: true, usuario: { email } };
}

export async function signOut() {
  if (isSupabaseConfigured) await supabase.auth.signOut();
}

export async function getSession() {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
  return null;
}

function traduzErro(msg) {
  if (/invalid login/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar.';
  return 'Nao foi possivel entrar. Tente novamente.';
}

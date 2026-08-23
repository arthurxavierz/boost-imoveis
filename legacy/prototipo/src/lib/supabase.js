// Inicializa o cliente do Supabase para o frontend.
//
// As variaveis vem do arquivo .env (localmente) ou das variaveis de
// ambiente do Netlify (em producao). Elas precisam comecar com VITE_
// para o Vite deixar disponivel aqui no navegador.
//
// A chave anon e publica de proposito. Ela so consegue fazer o que as
// regras de RLS do banco permitem. Por isso o RLS e obrigatorio.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se as duas variaveis existem, consideramos o Supabase configurado.
export const isSupabaseConfigured = Boolean(url && anonKey);

// So cria o cliente se houver configuracao. Senao, o app roda em modo
// demonstracao com os dados locais.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

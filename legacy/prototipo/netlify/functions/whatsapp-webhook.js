// ============================================================
// GANCHO DA FASE 2: WHATSAPP OFICIAL (Cloud API da Meta)
// ============================================================
// Esta funcao roda no servidor do Netlify. E o ponto que a Meta chama
// toda vez que chega ou sai uma mensagem no WhatsApp da Boost.
//
// Ela ja esta estruturada, mas so entra em uso quando voce configurar
// as variaveis de ambiente do WhatsApp no Netlify (veja o README).
// Enquanto isso, ela nao atrapalha nada e nao gera custo.
//
// Acesso pela URL: https://seusite.com.br/api/whatsapp-webhook
// ============================================================

import { createClient } from '@supabase/supabase-js';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function handler(event) {
  // 1. Verificacao inicial da Meta (acontece uma vez, na configuracao).
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const modo = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];
    if (modo === 'subscribe' && token === VERIFY_TOKEN) {
      return { statusCode: 200, body: challenge };
    }
    return { statusCode: 403, body: 'Token invalido' };
  }

  // 2. Mensagem recebida do cliente.
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const contato = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

      if (msg && contato) {
        // Grava o contato como um lead novo, com origem = whatsapp.
        // Esse campo ja existe na tabela leads, entao encaixa sem reforma.
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY   // chave mestra, so no servidor
        );
        await supabase.from('leads').insert({
          nome: contato?.profile?.name || 'Contato WhatsApp',
          telefone: msg.from,
          origem: 'whatsapp',
          etapa: 'novo',
          iniciais: 'WA'
        });
      }

      return { statusCode: 200, body: 'ok' };
    } catch (e) {
      console.error('Erro no webhook do WhatsApp:', e);
      return { statusCode: 200, body: 'ok' }; // sempre responde 200 para a Meta
    }
  }

  return { statusCode: 405, body: 'Metodo nao permitido' };
}

// ============================================================
// GANCHO DA FASE 3: ASSISTENTE DE IA
// ============================================================
// Esta funcao roda no servidor e conversa com a API do Claude. E aqui
// que a chave secreta da IA vive, longe do navegador.
//
// Usa o modelo Haiku, que e o mais barato, ideal para um assistente
// interno. Cada pergunta custa uma fracao de centavo.
//
// So funciona depois que voce colocar a variavel ANTHROPIC_API_KEY nas
// variaveis de ambiente do Netlify. Ate la, ela responde avisando isso.
//
// Chamada pelo frontend: POST /api/ai-assistant  com  { pergunta, contexto }
// ============================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metodo nao permitido' };
  }

  if (!ANTHROPIC_API_KEY) {
    return json(200, {
      resposta: 'O assistente ainda nao esta ativo. Configure a variavel ANTHROPIC_API_KEY no Netlify para ligar a Fase 3.'
    });
  }

  try {
    const { pergunta, contexto } = JSON.parse(event.body || '{}');

    const sistema = [
      'Voce e o assistente interno da Boost Negocios Imobiliarios, de Uberlandia.',
      'Ajuda os corretores com a carteira de imoveis e o funil de leads.',
      'Responde de forma objetiva, em portugues do Brasil.',
      contexto ? 'Contexto atual: ' + JSON.stringify(contexto) : ''
    ].join(' ');

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: sistema,
        messages: [{ role: 'user', content: pergunta || 'Ola' }]
      })
    });

    const data = await r.json();
    const resposta = (data?.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return json(200, { resposta: resposta || 'Sem resposta.' });
  } catch (e) {
    console.error('Erro no assistente de IA:', e);
    return json(500, { erro: 'Falha ao consultar o assistente.' });
  }
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

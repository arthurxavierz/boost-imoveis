import type { Metadata } from 'next';

import type { Interacao, Lead, Perfil } from '@boost/core';

import { Leads } from '@/componentes/leads/Leads';
import { interacoesDemo, leadsDemo } from '@/lib/dados-demo';
import { equipeDemo, modoDemo } from '@/lib/demonstracao';
import { exigirPermissao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const metadata: Metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

export default async function PaginaLeads({
  searchParams,
}: {
  searchParams: Promise<{
    visao?: string;
    consultor?: string;
    situacao?: string;
    lead?: string;
  }>;
}) {
  const params = await searchParams;
  const usuario = await exigirPermissao('leads');

  /**
   * O RLS ja filtra o que cada pessoa pode ver: gestao enxerga tudo,
   * corretor enxerga os proprios leads e os ainda sem dono. Nao ha
   * filtro por corretor aqui de proposito, para nao duplicar em
   * JavaScript uma regra que o banco ja aplica.
   */
  if (modoDemo()) {
    return (
      <Leads
        usuario={usuario}
        leads={leadsDemo(usuario, true)}
        equipe={equipeDemo()}
        interacoes={interacoesDemo(usuario)}
        parametros={params}
      />
    );
  }

  const supabase = await supabaseServidor();

  /**
   * As interacoes vem numa consulta so, e nao uma por lead. Com trinta
   * atendimentos abertos a diferenca entre as duas abordagens e trinta
   * idas ao banco a cada vez que alguem abre a tela.
   */
  const [leads, equipe, interacoes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(500),
    supabase.from('perfis').select('*').order('nome'),
    supabase
      .from('lead_interacoes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(1200),
  ]);

  if (leads.error) console.error('[leads] falha ao carregar:', leads.error);
  if (interacoes.error) console.error('[leads] falha no histórico:', interacoes.error);

  return (
    <Leads
      usuario={usuario}
      leads={(leads.data ?? []) as Lead[]}
      equipe={(equipe.data ?? []) as Perfil[]}
      interacoes={(interacoes.data ?? []) as Interacao[]}
      parametros={params}
    />
  );
}

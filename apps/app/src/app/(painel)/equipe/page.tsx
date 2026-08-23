import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { podeVerEquipe, type Perfil } from '@boost/core';

import { Equipe, type Carteira } from '@/componentes/equipe/Equipe';
import { carteiraDemo, equipeCompletaDemo } from '@/lib/dados-demo';
import { modoDemo } from '@/lib/demonstracao';
import { exigirUsuario } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const metadata: Metadata = { title: 'Equipe' };
export const dynamic = 'force-dynamic';

export default async function PaginaEquipe() {
  const usuario = await exigirUsuario();

  if (!podeVerEquipe(usuario)) redirect('/?erro=sem-permissao');

  if (modoDemo()) {
    const equipe = equipeCompletaDemo();
    const carteiras: Record<string, Carteira> = {};
    for (const p of equipe) carteiras[p.id] = carteiraDemo(p.id);

    return <Equipe usuario={usuario} equipe={equipe} carteiras={carteiras} />;
  }

  const supabase = await supabaseServidor();

  const { data, error } = await supabase.from('perfis').select('*').order('nome');
  if (error) console.error('[equipe] falha ao carregar:', error);

  const equipe = (data ?? []) as Perfil[];

  /**
   * A carteira de cada pessoa vem de uma consulta agregada por vez, e
   * nao de quatro contagens por linha. Com uma equipe de dez pessoas a
   * diferenca e dez idas ao banco contra quarenta.
   */
  const carteiras: Record<string, Carteira> = {};

  const resultados = await Promise.all(
    equipe.map((p) => supabase.rpc('carteira_da_pessoa', { p_usuario_id: p.id })),
  );

  equipe.forEach((p, indice) => {
    const linha = Array.isArray(resultados[indice].data)
      ? resultados[indice].data[0]
      : resultados[indice].data;

    carteiras[p.id] = {
      leads: Number(linha?.leads ?? 0),
      imoveis: Number(linha?.imoveis ?? 0),
      negocios: Number(linha?.negocios ?? 0),
    };
  });

  return <Equipe usuario={usuario} equipe={equipe} carteiras={carteiras} />;
}

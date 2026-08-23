import type { Metadata } from 'next';

import { resumirCarteira, type Imovel, type Perfil, type ProprietarioComCarteira } from '@boost/core';

import { Proprietarios } from '@/componentes/proprietarios/Proprietarios';
import { imoveisDemo, proprietariosDemo } from '@/lib/dados-demo';
import { equipeDemo, modoDemo } from '@/lib/demonstracao';
import { exigirPermissao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const metadata: Metadata = { title: 'Proprietários' };
export const dynamic = 'force-dynamic';

/**
 * Cadastro de quem entrega imóvel para a Boost.
 *
 * Fica atrás da permissão de imóveis, e não de uma permissão própria:
 * quem cadastra imóvel precisa cadastrar proprietário no mesmo gesto,
 * porque um não existe sem o outro. Uma permissão separada criaria a
 * situação de alguém poder abrir a ficha do imóvel e não conseguir
 * preencher o campo obrigatório dela.
 *
 * A carteira de cada proprietário é contada aqui, no servidor, junto
 * com a lista de imóveis que a tela já precisa para a gaveta. É uma
 * consulta a mais, não uma por proprietário — com cem proprietários,
 * a diferença entre as duas abordagens é cem idas ao banco a cada
 * abertura da tela.
 */
export default async function PaginaProprietarios({
  searchParams,
}: {
  searchParams: Promise<{ proprietario?: string }>;
}) {
  const params = await searchParams;
  const usuario = await exigirPermissao('imoveis');

  if (modoDemo()) {
    return (
      <Proprietarios
        usuario={usuario}
        proprietarios={proprietariosDemo(usuario)}
        imoveis={imoveisDemo()}
        equipe={equipeDemo()}
        abertoInicial={params.proprietario ?? null}
      />
    );
  }

  const supabase = await supabaseServidor();

  /**
   * O RLS já recorta o que cada pessoa alcança: a gestão vê todos os
   * proprietários, e o corretor só os de imóveis da própria carteira.
   * Não há filtro por papel aqui de propósito, para não repetir em
   * JavaScript uma regra que o Postgres já aplica — e que, se as duas
   * discordarem um dia, quem estará certo é o banco.
   */
  const [proprietarios, imoveis, equipe] = await Promise.all([
    supabase.from('proprietarios').select('*').order('nome'),
    supabase
      .from('imoveis')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .limit(1000),
    supabase.from('perfis').select('*').eq('ativo', true).order('nome'),
  ]);

  if (proprietarios.error) {
    console.error('[proprietarios] falha ao carregar:', proprietarios.error);
  }

  const lista = (imoveis.data ?? []) as Imovel[];

  const comCarteira: ProprietarioComCarteira[] = (proprietarios.data ?? []).map((p) => ({
    ...p,
    ...resumirCarteira(lista.filter((i) => i.proprietario_id === p.id)),
  }));

  return (
    <Proprietarios
      usuario={usuario}
      proprietarios={comCarteira}
      imoveis={lista}
      equipe={(equipe.data ?? []) as Perfil[]}
      abertoInicial={params.proprietario ?? null}
    />
  );
}

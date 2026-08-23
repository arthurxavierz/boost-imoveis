import type { Metadata } from 'next';

import type { Imovel, Perfil, Proprietario } from '@boost/core';

import { ListaImoveis } from '@/componentes/imoveis/ListaImoveis';
import { imoveisDemo, nomesProprietariosDemo } from '@/lib/dados-demo';
import { equipeDemo, modoDemo } from '@/lib/demonstracao';
import { exigirPermissao } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase-servidor';

export const metadata: Metadata = { title: 'Imóveis' };
export const dynamic = 'force-dynamic';

export default async function PaginaImoveis({
  searchParams,
}: {
  searchParams: Promise<{
    imovel?: string;
    proprietario?: string;
    'sem-proprietario'?: string;
  }>;
}) {
  const params = await searchParams;
  const usuario = await exigirPermissao('imoveis');

  if (modoDemo()) {
    return (
      <ListaImoveis
        usuario={usuario}
        imoveis={imoveisDemo()}
        proprietarios={nomesProprietariosDemo()}
        equipe={equipeDemo()}
        parametros={params}
      />
    );
  }

  const supabase = await supabaseServidor();

  /**
   * Os proprietários vêm só com id e nome. A tela usa os dois para o
   * seletor de filtro e para a coluna da tabela, e não precisa de CPF
   * nem de telefone aqui — trazer o registro inteiro colocaria dado
   * sensível de dezenas de pessoas no HTML de uma tela que só queria
   * mostrar um nome.
   */
  const [imoveis, proprietarios, equipe] = await Promise.all([
    supabase.from('imoveis').select('*').order('atualizado_em', { ascending: false }).limit(500),
    supabase.from('proprietarios').select('id, nome').order('nome'),
    supabase.from('perfis').select('*').eq('ativo', true).order('nome'),
  ]);

  if (imoveis.error) console.error('[imoveis] falha ao carregar:', imoveis.error);
  if (proprietarios.error) {
    console.error('[imoveis] falha ao carregar proprietários:', proprietarios.error);
  }

  return (
    <ListaImoveis
      usuario={usuario}
      imoveis={(imoveis.data ?? []) as Imovel[]}
      proprietarios={(proprietarios.data ?? []) as Pick<Proprietario, 'id' | 'nome'>[]}
      equipe={(equipe.data ?? []) as Perfil[]}
      parametros={params}
    />
  );
}

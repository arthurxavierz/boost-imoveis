-- ============================================================
-- BOOST IMOVEIS - ESTRUTURA DO BANCO DE DADOS
-- ============================================================
-- Cole este arquivo inteiro no Supabase, em SQL Editor > New query,
-- e clique em Run. Ele cria as tabelas e liga a seguranca (RLS).
--
-- RLS (Row Level Security) e a trava do cofre. Sem ele, qualquer
-- pessoa com a chave publica poderia ler e apagar o banco. Cada
-- politica abaixo diz exatamente quem pode fazer o que.
-- ============================================================

-- ---------- PERFIS ----------
-- Estende os usuarios do Auth do Supabase com nome e papel.
create table if not exists perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default 'Corretor',
  papel text not null default 'corretor',   -- 'admin' ou 'corretor'
  telefone text,
  criado_em timestamptz not null default now()
);

-- ---------- IMOVEIS ----------
create table if not exists imoveis (
  id bigint generated always as identity primary key,
  titulo text not null,
  tipo text not null,
  finalidade text not null default 'Venda',   -- Venda ou Locacao
  bairro text,
  cidade text not null default 'Uberlandia',
  valor numeric not null default 0,
  status text not null default 'disponivel',  -- disponivel, reservado, vendido, locado
  quartos int default 0,
  banheiros int default 0,
  vagas int default 0,
  area numeric default 0,
  latitude numeric,                            -- pronto para mapa / Google Places
  longitude numeric,
  corretor text,                               -- nome para exibir
  corretor_id uuid references perfis (id),     -- dono do imovel (para RLS futuro)
  destaque boolean not null default false,
  publicado boolean not null default false,    -- aparece na vitrine publica
  cover text not null default 'cv1',           -- estilo visual do cartao
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------- FOTOS DOS IMOVEIS ----------
create table if not exists imovel_fotos (
  id bigint generated always as identity primary key,
  imovel_id bigint not null references imoveis (id) on delete cascade,
  url text not null,
  ordem int not null default 0
);

-- ---------- LEADS ----------
create table if not exists leads (
  id bigint generated always as identity primary key,
  nome text not null,
  telefone text,
  email text,
  imovel text,                                 -- titulo do imovel de interesse
  imovel_interesse_id bigint references imoveis (id),
  valor numeric default 0,
  origem text not null default 'manual',       -- site, whatsapp, places, vitrine, indicacao, manual
  iniciais text default '--',
  corretor_id uuid references perfis (id),
  etapa text not null default 'novo',          -- novo, contato, visita, proposta, fechado, perdido
  criado_em timestamptz not null default now()
);

-- ---------- INTERACOES ----------
create table if not exists interacoes (
  id bigint generated always as identity primary key,
  lead_id bigint not null references leads (id) on delete cascade,
  tipo text not null default 'nota',           -- nota, ligacao, whatsapp, email
  conteudo text,
  autor_id uuid references perfis (id),
  criado_em timestamptz not null default now()
);

-- ============================================================
-- SEGURANCA (RLS)
-- ============================================================

alter table perfis enable row level security;
alter table imoveis enable row level security;
alter table imovel_fotos enable row level security;
alter table leads enable row level security;
alter table interacoes enable row level security;

-- PERFIS: cada usuario ve e edita o proprio perfil.
create policy "perfil proprio - ler" on perfis
  for select using (auth.uid() = id);
create policy "perfil proprio - editar" on perfis
  for update using (auth.uid() = id);

-- IMOVEIS: o publico (vitrine) ve apenas imoveis publicados e disponiveis.
create policy "vitrine publica" on imoveis
  for select using (publicado = true and status = 'disponivel');

-- IMOVEIS: usuarios logados (corretores) veem e gerenciam a carteira toda.
create policy "carteira - ler" on imoveis
  for select using (auth.role() = 'authenticated');
create policy "carteira - inserir" on imoveis
  for insert with check (auth.role() = 'authenticated');
create policy "carteira - editar" on imoveis
  for update using (auth.role() = 'authenticated');
create policy "carteira - excluir" on imoveis
  for delete using (auth.role() = 'authenticated');

-- FOTOS: acompanham a regra do imovel. Publico ve fotos de imovel publicado.
create policy "fotos - publico" on imovel_fotos
  for select using (
    exists (select 1 from imoveis i where i.id = imovel_id and i.publicado = true)
  );
create policy "fotos - logado" on imovel_fotos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- LEADS: por enquanto todo corretor logado enxerga o funil.
-- Para restringir "cada corretor ve so os seus", troque o using por:
--   auth.uid() = corretor_id
create policy "leads - logado" on leads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- INTERACOES: visiveis para usuarios logados.
create policy "interacoes - logado" on interacoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- CRIA UM PERFIL AUTOMATICO QUANDO UM USUARIO SE CADASTRA
-- ============================================================
create or replace function public.novo_usuario()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfis (id, nome) values (new.id, coalesce(new.email, 'Corretor'));
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.novo_usuario();

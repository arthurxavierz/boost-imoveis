# Boost Negocios Imobiliarios

Sistema de gestao imobiliaria da Boost. CRM, gestao de imoveis e vitrine publica, construido pela Achilles Media.

Este guia leva voce do zero ate o site no ar, com banco de dados de verdade. Siga na ordem. Nenhum passo depende de conhecimento avancado.

---

## O que este projeto ja tem

- Login com perfis de acesso (administrador e consultor)
- Painel com VGV, imoveis ativos, vendidos e funil. O admin filtra o desempenho por consultor e ve uma tabela de produtividade da equipe
- Gestao de imoveis com CRUD completo: criar, editar e excluir, com galeria de fotos. So o admin ou o consultor que cadastrou pode editar ou excluir cada imovel
- CRM de leads em kanban, com arrastar e soltar, observacoes por lead, arquivar e excluir
- Modulo financeiro para o admin: receita realizada, a receber, despesas, resultado, faturamento por mes, comissao por consultor, tabela de lancamentos e novo lancamento
- Aba de usuarios para o admin: cria acessos, define perfil e liga ou desliga funcionalidades por pessoa
- Vitrine publica, do jeito que o cliente final ve
- Layout responsivo para computador e celular, com menu lateral que abre pelo botao no topo
- Banco de dados no Supabase com seguranca (RLS) ligada
- Duas funcoes server-side ja preparadas: WhatsApp (Fase 2) e assistente de IA (Fase 3)

O projeto funciona em dois modos. Sem o Supabase configurado, ele roda em modo demonstracao com dados de exemplo, ja com um administrador e quatro consultores. Um seletor "Ver como" no rodape do menu permite alternar entre os usuarios para testar as restricoes de permissao sem precisar de varios logins reais. Com o Supabase configurado, ele usa dados e login reais. Um selo no canto inferior direito mostra em qual modo voce esta.

Observacao: as novas telas (financeiro, usuarios, edicao e exclusao, observacoes de lead, galeria de fotos) operam sobre dados em memoria enquanto o banco nao esta sincronizado. A camada em src/data/store.js ja concentra todas as operacoes, entao a ligacao com o Supabase acontece nesse unico arquivo quando voce quiser dar esse passo.

---

## Parte 1. Rodar no seu computador

Voce precisa do Node.js instalado (versao 20 ou mais nova).

1. Abra a pasta do projeto no VS Code.
2. Abra o terminal (menu Terminal, New Terminal) e rode:

   ```
   npm install
   npm run dev
   ```

3. O site abre sozinho em `http://localhost:5173`. Clique em Entrar. Neste momento ele esta em modo demonstracao, entao qualquer e-mail e senha funcionam.

Para gerar a versao final de producao, rode `npm run build`. O resultado vai para a pasta `dist`.

---

## Parte 2. Criar o banco no Supabase

1. Crie uma conta em `supabase.com` e clique em New project.
2. Escolha um nome, uma senha para o banco e a regiao Sao Paulo.
3. Quando o projeto terminar de criar, va em SQL Editor, clique em New query.
4. Abra o arquivo `supabase/schema.sql` deste projeto, copie tudo, cole no editor e clique em Run. Isso cria as tabelas e liga a seguranca.
5. Repita com o arquivo `supabase/seed.sql`. Isso carrega os imoveis e leads de exemplo. Rode apenas uma vez.

### Pegar as chaves

Va em Settings, API. Voce vai ver tres coisas que importam:

- Project URL
- a chave `anon public`
- a chave `service_role`

Guarde as tres. Atencao: a `service_role` e a chave mestra. Ela nunca pode aparecer no navegador. So entra nas funcoes do servidor.

### Criar o primeiro corretor

Va em Authentication, Users, Add user. Crie com e-mail e senha. Esse sera o login da Boost. O perfil dele e criado automaticamente.

---

## Parte 3. Conectar o projeto ao Supabase

1. Na raiz do projeto, copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
2. Preencha assim, com os valores que voce pegou:

   ```
   VITE_SUPABASE_URL=coloque-aqui-a-project-url
   VITE_SUPABASE_ANON_KEY=coloque-aqui-a-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=coloque-aqui-a-service-role
   ```

3. Pare o servidor (Ctrl C no terminal) e rode `npm run dev` de novo.

Agora o selo no canto deve mostrar Supabase conectado, e o login passa a ser de verdade.

O arquivo `.env` nunca sobe para o GitHub. Ele ja esta protegido pelo `.gitignore`. Suas chaves ficam so na sua maquina e, depois, nas variaveis do Netlify.

---

## Parte 4. Subir para o GitHub

Este e o seu fluxo de sempre.

1. Crie um repositorio novo e vazio no GitHub.
2. No terminal do projeto, rode:

   ```
   git init
   git add .
   git commit -m "Boost Imoveis, fase 1"
   git branch -M main
   git remote add origin URL-DO-SEU-REPOSITORIO
   git push -u origin main
   ```

Confira no GitHub que o arquivo `.env` NAO subiu. Se ele nao aparece na lista, esta certo.

---

## Parte 5. Publicar no Netlify

1. Em `netlify.com`, clique em Add new site, Import an existing project, e escolha o repositorio do GitHub.
2. O Netlify le o arquivo `netlify.toml` sozinho, entao o comando de build e a pasta ja vem certos. E so confirmar.
3. Antes de publicar, va em Site configuration, Environment variables, e adicione as mesmas variaveis do seu `.env`:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   Quando for ativar WhatsApp e IA, voce adiciona as outras aqui tambem.

4. Clique em Deploy. Em um ou dois minutos o site esta no ar num endereco terminado em `.netlify.app`.

Toda vez que voce der `git push`, o Netlify publica sozinho a nova versao.

---

## Parte 6. Apontar o dominio na Cloudflare

1. Registre ou traga o dominio `boostimoveis.com.br` para a Cloudflare.
2. No Netlify, va em Domain management, Add a domain, e informe o dominio.
3. O Netlify mostra os registros de DNS que ele precisa. Na Cloudflare, em DNS, crie esses registros.
4. Deixe o SSL da Cloudflare em Full. O certificado HTTPS fica pronto sozinho.

Pronto. O sistema da Boost fica acessivel pelo dominio proprio, com HTTPS e a protecao da Cloudflare na frente.

---

## Ligar as integracoes depois (Fases 2 e 3)

As funcoes ja estao no projeto, em `netlify/functions`. Elas ficam dormindo ate voce preencher as variaveis de ambiente no Netlify.

### WhatsApp oficial

1. Crie a conta no Meta Business e verifique a empresa.
2. Registre um numero no WhatsApp Cloud API e pegue o token de acesso.
3. No Netlify, adicione `WHATSAPP_VERIFY_TOKEN` (um texto que voce inventa), `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`.
4. No painel da Meta, configure o webhook apontando para `https://boostimoveis.com.br/api/whatsapp-webhook` e use o mesmo verify token.

A partir dai, todo cliente que chamar no WhatsApp vira um lead automatico, com origem whatsapp, dentro do CRM.

### Assistente de IA

1. Crie uma chave em `console.anthropic.com`.
2. No Netlify, adicione `ANTHROPIC_API_KEY`.

A funcao em `/api/ai-assistant` passa a responder. Ela usa o modelo Haiku, o mais barato, e custa centavos por uso.

---

## Estrutura do projeto

```
boost-imoveis/
  index.html                 pagina principal
  netlify.toml               configuracao de build e deploy
  .env.example               modelo das variaveis de ambiente
  src/
    main.js                  liga tudo: login, navegacao, eventos
    styles/main.css          o design da Boost
    lib/
      supabase.js            conexao com o Supabase
      auth.js                login e logout
      format.js              formatacao de valores e icones
    data/
      store.js               busca e grava dados, com fallback local
      mock.js                dados de exemplo
    ui/
      render.js              desenha as telas e os cartoes
  supabase/
    schema.sql               cria as tabelas e a seguranca
    seed.sql                 carrega os dados de exemplo
  netlify/functions/
    whatsapp-webhook.js      gancho da Fase 2
    ai-assistant.js          gancho da Fase 3
```

---

## Uma regra de ouro sobre seguranca

A chave `anon` pode ficar no navegador. Ela so faz o que o RLS do banco permite. A chave `service_role` nunca pode sair do servidor. Se ela vazar, alguem tem acesso total ao banco. Ela vive apenas nas variaveis de ambiente do Netlify e nas funcoes. Nunca no frontend, nunca no GitHub.

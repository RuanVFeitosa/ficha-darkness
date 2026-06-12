# Deploy da Ficha Darkness

Este projeto pode subir na Render como um unico Web Service Node ou na Vercel com React estatico e funcoes em `/api`.

## Banco gratuito com Supabase

1. Crie uma conta em https://supabase.com.
2. Crie um projeto no plano Free.
3. Abra o SQL Editor do projeto.
4. Rode este SQL:

```sql
create table if not exists public.personagens (
  id text primary key,
  personagem jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

5. Copie a `Project URL`.
6. Copie a chave `service_role` em `Project Settings > API Keys`.

Importante: a `service_role` fica apenas no backend. Nunca coloque essa chave no frontend.

## Render

1. Suba a branch `main` para o GitHub.
2. Entre em https://dashboard.render.com.
3. Clique em `New` e escolha `Blueprint`, ou crie um `Web Service`.
4. Selecione o repositorio `RuanVFeitosa/ficha-darkness`.
5. Use:

- Build command: `npm install && npm run build`
- Start command: `npm run backend`
- Node: `22`

6. Configure as variaveis de ambiente:

```txt
SUPABASE_URL = sua Project URL do Supabase
SUPABASE_SERVICE_ROLE_KEY = sua service_role key do Supabase
SUPABASE_TABLE = personagens
```

7. Aguarde o build e abra a URL `onrender.com` gerada.

## Render gratuito

Com Supabase, voce nao precisa de disco persistente na Render. Pode usar um Web Service Free para testar. O serviço gratuito pode dormir depois de ficar sem acesso, entao o primeiro carregamento pode demorar um pouco.

## Teste local antes do deploy

Sem Supabase configurado, o backend usa JSON local:

```bash
npm run dev
```

Abra:

```txt
http://localhost:3000
```

Para testar localmente usando Supabase, defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no terminal antes de rodar `npm run backend`.

## Vercel

Na Vercel, o React e publicado como site estatico e o backend roda como funcoes em `/api`.

1. Suba a branch `main` para o GitHub.
2. Entre em https://vercel.com e importe o repositorio.
3. Use estas configuracoes:

```txt
Framework Preset: Create React App
Install Command: npm install
Build Command: npm run build
Output Directory: build
```

4. Configure as variaveis de ambiente em `Settings > Environment Variables`:

```txt
SUPABASE_URL = sua Project URL do Supabase
SUPABASE_SERVICE_ROLE_KEY = sua service_role key do Supabase
SUPABASE_TABLE = personagens
```

5. Depois do deploy, teste:

```txt
https://seu-projeto.vercel.app/api/health
```

O retorno esperado deve mostrar `ok: true` e `storage: "supabase"`. Se aparecer `storage: "json"`, as variaveis do Supabase nao foram configuradas no ambiente do deploy.

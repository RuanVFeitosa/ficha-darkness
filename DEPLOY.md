# Deploy da Ficha Darkness

Este projeto esta configurado para deploy na Vercel com frontend estatico e backend em Functions dentro de `/api`.

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

Na Vercel, o React e publicado como site estatico e os arquivos em `api/` viram Functions. O frontend usa `/api` automaticamente em producao, entao nao precisa configurar `REACT_APP_API_URL` quando tudo esta no mesmo projeto Vercel.

1. Suba a branch `main` para o GitHub.
2. Entre em https://vercel.com e importe o repositorio.
3. Use estas configuracoes:

```txt
Framework Preset: Create React App
Install Command: npm install
Build Command: npm run build
Output Directory: frontend/build
```

4. Configure as variaveis de ambiente em `Settings > Environment Variables`:

```txt
SUPABASE_URL = sua Project URL do Supabase
SUPABASE_SERVICE_ROLE_KEY = sua service_role key do Supabase
SUPABASE_TABLE = personagens
```

5. Depois do deploy, teste o backend:

```txt
https://seu-projeto.vercel.app/api/health
```

O retorno esperado deve mostrar `ok: true` e `storage: "supabase"`. Se aparecer `storage: "json"`, as variaveis do Supabase nao foram configuradas no ambiente da Vercel.

## Backend na Vercel

As rotas do backend ficam disponiveis sob `/api`:

```txt
/api/health
/api/personagens
/api/personagens/:id
/api/personagem
/api/loja/catalogo
```

Os arquivos em `api/` apenas encaminham as requisicoes para `backend/server.js`, mantendo a logica do backend separada do frontend.

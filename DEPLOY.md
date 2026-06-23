# Deploy da Ficha Darkness

Arquitetura recomendada quando o servidor precisa ficar sempre ligado:

- Frontend: Vercel
- Backend Node: Render, Railway, Fly.io ou outro host com processo persistente
- Banco: Supabase

A Vercel continua servindo o site React. O backend fica em uma URL propria e o frontend usa `REACT_APP_API_URL` para chamar essa API.

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

## Backend sempre ligado

Use o `render.yaml` deste repositorio para criar o backend na Render.

Configuracao do Web Service:

```txt
Build Command: npm install
Start Command: npm run backend
Node: 22
```

Variaveis de ambiente do backend:

```txt
SERVE_FRONTEND = false
CORS_ORIGIN = https://seu-projeto.vercel.app
SUPABASE_URL = sua Project URL do Supabase
SUPABASE_SERVICE_ROLE_KEY = sua service_role key do Supabase
SUPABASE_TABLE = personagens
```

Durante testes, `CORS_ORIGIN = *` funciona. Para producao, prefira a URL exata da Vercel.

Depois do deploy, teste:

```txt
https://seu-backend.onrender.com/api/health
```

O retorno esperado deve mostrar `ok: true` e `storage: "supabase"`.

Observacao: planos gratuitos de alguns hosts podem dormir. Para servidor realmente sempre ligado, use um plano pago ou um provedor que garanta processo persistente no plano escolhido.

## Frontend na Vercel

Na Vercel, publique apenas o React estatico.

Configuracoes:

```txt
Framework Preset: Create React App
Install Command: npm install
Build Command: npm run build
Output Directory: frontend/build
```

Variavel de ambiente do frontend:

```txt
REACT_APP_API_URL = https://seu-backend.onrender.com/api
```

Depois de salvar essa variavel, faca um novo deploy do frontend na Vercel. O React embute variaveis `REACT_APP_*` no momento do build.

## Teste local

Sem Supabase configurado, o backend usa JSON local:

```bash
npm run dev
```

Abra:

```txt
http://localhost:3000
```

Para testar localmente usando Supabase, defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no terminal antes de rodar `npm run backend`.

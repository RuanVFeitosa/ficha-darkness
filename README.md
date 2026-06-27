# Ficha Darkness

Aplicacao de ficha de RPG com frontend React e backend Node separados por workspace.

## Estrutura

- `frontend/`: aplicacao React criada com Create React App.
- `backend/`: API Node, persistencia local em JSON ou Supabase, e servidor de producao.
- `api/`: adaptadores serverless legados da Vercel. O deploy atual ignora esta pasta para manter a Vercel apenas como frontend.
- `scripts/`: utilitarios de desenvolvimento.

## Scripts

Na raiz do projeto:

```bash
npm install
npm run dev
```

`npm run dev` sobe o frontend em `http://localhost:3000` e a API em `http://localhost:4000`.

Comandos uteis:

```bash
npm run frontend
npm run backend
npm run build
npm test
```

`npm run build` gera o build de producao em `frontend/build`. Em producao, a Vercel serve apenas esse frontend estatico e o backend roda separado na Render.

## API local

Para verificar se o backend esta online:

```txt
http://localhost:4000/api/health
```

Sem Supabase configurado, o backend salva fichas em `backend/data`. Para hospedagem publica, configure:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_TABLE=personagens
```

Cada jogador pode usar uma ficha especifica pelo parametro `ficha`:

```txt
http://localhost:3000/?ficha=ana
http://localhost:3000/?ficha=bruno
http://localhost:3000/?ficha=mestre
```

## Deploy

Veja [DEPLOY.md](DEPLOY.md) para usar frontend na Vercel e backend sempre ligado em um host Node.

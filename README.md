# Ficha Darkness

Aplicacao de ficha de RPG com frontend React e backend Node separados por workspace.

## Estrutura

- `frontend/`: aplicacao React criada com Create React App.
- `backend/`: API Node, persistencia local em JSON ou Supabase, e servidor de producao.
- `api/`: adaptadores serverless legados da Vercel. O deploy atual ignora esta pasta para manter a Vercel apenas como frontend.
- `scripts/`: utilitarios de desenvolvimento.
- `docs/`: documentação de arquitetura, sistemas e publicação.
- `archive/development/`: scripts antigos, capturas e registros preservados para consulta.

O guia de pastas e as convenções estão em [Estrutura do projeto](docs/ESTRUTURA.md).
Componentes do frontend são agrupados por área em `frontend/src/components/`; estilos ficam em `frontend/src/styles/` e dados de regras em `frontend/src/data/`.

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

Veja [Deploy](docs/DEPLOY.md) para usar frontend na Vercel e backend sempre ligado em um host Node.

Outros documentos: [Espiral](docs/ESPIRAL.md), [tarefas de infraestrutura](docs/TODO.md) e [índice da documentação](docs/README.md).

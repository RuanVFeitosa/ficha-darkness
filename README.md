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

### Ativar o Dashboard Master

1. No backend, configure `DARKNESS_OWNER_CODE` com um código numérico de 8 a 16 dígitos. Em desenvolvimento, use `backend/.env.local` ou defina a variável no terminal antes de iniciar o backend.
2. Se o backend usa Supabase, aplique a migração `20261124120000_perfis_mestres.sql` e configure `DARKNESS_MASTER_SECRET` com um segredo aleatório e estável no servidor. O backend usa a chave de serviço se o segredo dedicado estiver ausente. A troca desse segredo invalida códigos já cadastrados. Sem Supabase, os perfis ficam no diretório de dados local.
3. Entre na opção **Mestre** com seu código para abrir o **Dashboard Master**. O menu conecta o painel do proprietário ao Painel de Mestre.

O visitante pode criar sua conta na Área do Mestre com um código numérico de 4 a 16 dígitos. Em **Meus personagens**, o mestre pode criar ou vincular um perfil de jogador e entrar em mesas 2D com suas fichas. O vínculo com o perfil de jogador é lembrado no navegador atual.

Para habilitar campanhas de Ordem Paranormal no Supabase, aplique também `20261125120000_campanhas_ordem_tabletop.sql`. Essa migração libera o sistema Ordem e reserva a criação de mesas 3D à API autenticada do proprietário.

Veja [Deploy](docs/DEPLOY.md) para usar frontend na Vercel e backend sempre ligado em um host Node.

Outros documentos: [Espiral](docs/ESPIRAL.md), [tarefas de infraestrutura](docs/TODO.md) e [índice da documentação](docs/README.md).

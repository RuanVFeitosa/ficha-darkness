# Backend no Northflank

Este guia mantém o frontend na hospedagem atual e publica apenas a API Node.
O Dockerfile usa Node 22 e o lockfile do repositório. Dados locais, arquivos de
ambiente e testes ficam fora da imagem.

## Serviço

1. Conecte a conta GitHub ao Northflank e autorize o repositório
   `RuanVFeitosa/ficha-darkness`.
2. Crie um projeto e um serviço do tipo **Combined** (build e deployment),
   usando a branch que contém estes arquivos.
3. Escolha **Dockerfile**, caminho `/backend/Dockerfile` e contexto `/`.
4. Selecione os recursos incluídos no Sandbox e mantenha **uma instância**.
   Confirme o custo exibido antes de criar recursos adicionais.
5. Exponha a porta **4000**, protocolo HTTP, publicamente. O endpoint público
   usa HTTPS fornecido pela plataforma.
6. Adicione uma readiness probe HTTP: porta `4000`, caminho `/api/health`.
   Use o mesmo caminho para a liveness probe, com atraso inicial de 10 segundos.

O comando de inicialização já está na imagem: `node backend/server.js`.

## Variáveis de execução

Configure `CORS_ORIGIN` com o endereço real do frontend, por exemplo
`https://seu-projeto.vercel.app`. Para vários endereços, separe por vírgula.
Configure também `MESTRE_PASSWORD` com a senha do mestre usando um segredo
da plataforma, sem inserir a senha no código ou no Git.

O Dockerfile define `HOST=0.0.0.0`, `PORT=4000`, `SERVE_FRONTEND=false`,
`NODE_ENV=production` e `DATA_DIR=/data`.

Se o backend atual já usa um banco externo, replique suas variáveis de execução
no novo serviço através do painel. Não copie segredos para o Dockerfile ou frontend.

## Dados persistentes e migração

O backend ainda grava arquivos JSON, inclusive dados de investigação. Para
preservá-los entre deploys, monte um volume persistente em **`/data`**, com
permissão de escrita para o processo. Verifique se o volume está incluído na
franquia gratuita: disco persistente pode ter cobrança própria. A imagem cria
a pasta `/data`, mas isso sozinho não torna o disco persistente.

Antes de trocar a URL pública:

1. Faça backup do diretório de dados do backend atual e preserve o backup.
2. Pause alterações no backend antigo durante a cópia final.
3. Copie o conteúdo do diretório antigo para o volume `/data` do novo serviço,
   preservando nomes de arquivos e subpastas. Os dados reais não estão na imagem.
4. Se houver banco externo, mantenha o mesmo banco durante a migração.
5. Valide uma ficha existente, uma gravação e a leitura após reiniciar o serviço.

Se o Sandbox não disponibilizar volume gratuito, o deploy pode ser testado,
mas os dados em disco precisam ser migrados para armazenamento durável antes
da troca definitiva. Não trate o disco temporário como backup.

## Frontend e verificação

1. Abra `https://ENDPOINT-NORTHFLANK/api/health` e confira `ok: true`.
2. Na hospedagem do frontend, altere `REACT_APP_API_URL` para
   `https://ENDPOINT-NORTHFLANK/api`.
3. Faça um novo build/deploy do frontend: a variável é incorporada no build.
4. Verifique abertura e salvamento de fichas pelo site e o acesso de outro jogador.
5. Mantenha o backend antigo disponível até validar a migração. Em caso de
   falha, restaure a URL anterior no frontend e faça outro build.

## Referências

- Dockerfile e contexto: https://northflank.com/docs/v1/application/build/build-with-a-dockerfile
- Health checks: https://northflank.com/docs/v1/application/observe/configure-health-checks
- Planos e franquias: https://northflank.com/pricing
- Situação da plataforma: https://status.northflank.com/

Em 03/11/2026, o incidente de segurança divulgado em 30/10 ainda constava em
monitoramento. A plataforma orientava clientes existentes a rotacionar os
segredos. Consulte o status atualizado antes de cadastrar credenciais de produção.

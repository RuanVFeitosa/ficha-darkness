# Backend no Koyeb — acesso gratuito indisponível para novas contas

**Correção em 03/11/2026:** o anúncio oficial da entrada do Koyeb na Mistral
informa que novos usuários precisam contratar um plano pago. A documentação
de instâncias ainda descreve recursos Free, mas isso não garante acesso para
novas contas. Este guia não deve ser usado como indicação de hospedagem gratuita.
O painel da conta exibiu apenas o aviso da transição, sem criação de serviços.

Fonte: https://www.koyeb.com/blog/koyeb-is-joining-mistral-ai-to-build-the-future-of-ai-infrastructure

As instruções abaixo são referência técnica para contas que já tenham acesso
ao serviço; a seleção Free depende de elegibilidade e disponibilidade na conta.

O Dockerfile existente em `backend/Dockerfile` também funciona com o builder
Docker do Koyeb. O frontend permanece na hospedagem atual.

## Publicar

1. Entre em https://app.koyeb.com/ e crie ou acesse sua conta.
2. Conecte o GitHub, autorizando `RuanVFeitosa/ficha-darkness`.
3. Crie um **Web Service** a partir desse repositório. Selecione a branch que
   contém `backend/Dockerfile` e `.dockerignore`, já enviados ao GitHub.
4. Escolha o builder **Dockerfile**, caminho `backend/Dockerfile`.
   Mantenha o diretório de trabalho/contexto na raiz do repositório, não em
   `backend`: a instalação usa o `package-lock.json` da raiz.
5. Se sua conta antiga tiver acesso, selecione a instância **Free**, em Washington ou Frankfurt.
   Confira que o preço do serviço está zerado antes de publicar; outros tipos
   de instância têm cobrança própria.
6. Configure a porta **4000**, protocolo **HTTP**, rota pública **/**.
7. Configure o health check HTTP na porta `4000`, caminho `/api/health`.
8. O comando de execução já está no Dockerfile: `node backend/server.js`.

## Variáveis de execução

- `CORS_ORIGIN`: URL real do frontend. Separe múltiplas origens por vírgula.
- `MESTRE_PASSWORD`: senha do mestre, cadastrada como segredo no painel.
- Mantenha as variáveis de banco externo já usadas pelo backend atual,
  cadastrando as credenciais pelo painel, nunca no Git ou no frontend.

A imagem define `PORT=4000`, `HOST=0.0.0.0`, `SERVE_FRONTEND=false`,
`NODE_ENV=production` e `DATA_DIR=/data`.

## Persistência: condição para trocar o backend de produção

O Free não aceita volumes persistentes. `/data` é temporário: mudar `DATA_DIR`
não protege os arquivos contra reinicializações ou novos deploys.

O servidor possui persistência externa opcional para fichas, catálogo e árvores,
mas também grava arquivos locais, incluindo dados de investigação. É necessário
verificar quais funções estão em uso e garantir persistência externa para todos
os dados necessários antes da migração definitiva.

Faça backup dos arquivos do backend antigo. Mantenha o backend antigo disponível
e não altere a URL do frontend até validar leitura, gravação e leitura após
reiniciar o novo serviço. Não copie fichas privadas para a imagem Docker.

## Conectar o frontend

Após publicar, abra `https://SEU-ENDPOINT.koyeb.app/api/health` e confira
`ok: true`. O campo `storage` informa se o servidor está usando persistência
externa para as fichas ou JSON local; ele não garante persistência de todas
as demais funcionalidades.

Depois da validação da persistência, configure na hospedagem do frontend:

```text
REACT_APP_API_URL=https://SEU-ENDPOINT.koyeb.app/api
```

Faça um novo build/deploy do frontend para incorporar a URL. Valide o acesso
de outro jogador, salvamento de ficha e os recursos usados na campanha.

## Limites consultados em 03/11/2026

- Uma instância gratuita por organização: 512 MB RAM, 0,1 vCPU e 2 GB SSD temporário.
- Disponível em Washington ou Frankfurt.
- Suspende após uma hora sem tráfego.
- Não permite volumes persistentes.
- O cadastro pode solicitar cartão para verificação. Confirme no fluxo da conta.

Documentação oficial:

- https://www.koyeb.com/docs/build-and-deploy/deploy-with-git
- https://www.koyeb.com/docs/build-and-deploy/build-from-git
- https://www.koyeb.com/docs/reference/instances
- https://www.koyeb.com/docs/faqs/pricing

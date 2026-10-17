# Publicação das alterações do tabletop

Antes de publicar o frontend, execute no projeto Supabase as migrações pendentes, na ordem:

- 034: tipo de tabletop da campanha.
- 035: biblioteca de mapas 3D.
- 036: formatos e tamanho dos modelos no bucket mapas.
- 037: clima e câmera compartilhados.
- 038: dificuldades de cena ESPIRAL.

Os arquivos estão em supabase/migrations. Commitar os arquivos SQL não executa as migrações no banco remoto.

O frontend mantém a criação de campanhas 2D e o salvamento de cenas com dificuldades padrão em bancos sem as colunas de 034/038. Campanhas 3D e dificuldades personalizadas exigem as respectivas migrações; a aplicação informa a atualização necessária sem descartar essas opções.

Validação local antes do commit, em PowerShell:

```powershell
$env:CI = 'true'
npm run build
npm run test --workspace frontend -- --watchAll=false --runInBand
node --test cloudflare/media/worker.test.mjs
git diff --check
```

Inclua os componentes, serviços, utilitários, assets, arquivos do Worker, documentação e migrações novos no commit. Confira git status e git diff --cached --stat antes de confirmar o commit.

A sincronização de avatares 3D entre navegadores continua pendente. A publicação também precisa ser validada com mestre e jogador em navegadores separados, usando o banco remoto atualizado.

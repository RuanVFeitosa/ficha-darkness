# Arquivos no Cloudflare R2

Integração preparada, ainda não provisionada na sua conta.

## Ativar

1. No Cloudflare, ative R2 e crie o bucket privado `darkness-media`.
2. Em `cloudflare/media/wrangler.toml`, configure SUPABASE_URL e ALLOWED_ORIGINS (localhost e domínio publicado, separados por vírgula). O bucket fica privado; o Worker fornece as URLs de leitura.
3. Nesse diretório, execute `npx wrangler login`, depois `npx wrangler secret put SUPABASE_ANON_KEY` e informe a chave anon do projeto. Não use service_role. Execute `npx wrangler deploy`.
4. Configure `REACT_APP_MEDIA_URL=https://darkness-media.SUA-CONTA.workers.dev` no ambiente do frontend, reinicie o desenvolvimento ou refaça o build.
5. Entre na conta Supabase e envie uma cena, uma evidência e um token. Confirme as URLs do Worker e os objetos no R2. Verifique com uma segunda sessão de jogador.

Nenhuma chave R2 vai ao navegador. O Worker usa o binding MEDIA e valida a sessão Supabase em cada escrita. Uploads precisam de uma conta autenticada; acessar só pelo código da ficha não autentica o jogador. Leitura é pública por URL, como no Storage anterior: não use para arquivos que precisam de acesso privado. Cada conta só remove seus próprios objetos.

## Comportamento

Novos uploads de mapas, modelos GLB, cenas, evidências, imagens de computadores, áudio e documentos usam R2 quando a variável está configurada. Erros do R2 aparecem ao usuário: não há fallback silencioso que volte a ocupar o Supabase. Sem configuração, o Storage anterior continua funcionando. Demo mantém arquivos locais.

Ao salvar o estado dos tokens 3D, imagens em base64 são enviadas ao R2 e substituídas por URLs antes da sincronização. Uploads repetidos de tokens são reutilizados durante a sessão. As fichas locais ainda podem manter suas imagens originais: esta mudança reduz o payload do tabletop, não migra automaticamente as fichas.

Os caminhos de evidências novas têm prefixo r2: para que a exclusão use o provedor correto. Caminhos antigos continuam sendo removidos no Supabase. Se outro usuário tentar apagar um arquivo R2, a operação é recusada.

## Imagens existentes

Não foram apagados nem migrados arquivos existentes. Antes de liberar espaço no Supabase:

1. Faça backup das tabelas e dos buckets.
2. Copie os arquivos preservando uma lista origem → nova URL/caminho.
3. Atualize apenas referências identificadas em cenas, documentos, mapas e tokens; valide cada arquivo copiado.
4. Teste campanhas e permissões com mestre e jogador.
5. Só remova a origem depois de verificar que nenhuma referência antiga continua em uso.

A migração em massa depende da conta configurada e de uma auditoria das referências existentes. Não basta copiar arquivos: URLs antigas precisam ser atualizadas. Não exclua objetos compartilhados por múltiplos registros sem verificar as referências.

Documentação oficial: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/

## Migração pelo tabletop

Na visão do mestre, abra Tokens e vá até Arquivos no R2. Verificar configuração identifica variáveis ausentes e falta de sessão. Migrar imagens existentes baixa um backup JSON e copia imagens base64 e URLs públicas do projeto Supabase em campanhas, cenas, tokens, documentos, inimigos e personagens acessíveis à sua conta, além das fichas e tokens deste navegador. A operação registra falhas individualmente, não apaga originais e pode ser repetida para pendências. Imagens de outros sites, arquivos locais em IndexedDB e imagens fixas incluídas no código não são migradas por esta ferramenta. Fichas salvas em outros computadores precisam ser migradas nesses navegadores. Evite editar os registros durante a migração.

No ambiente local, frontend/.env.local precisa de REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY e REACT_APP_MEDIA_URL. O secret configurado no Worker não configura o frontend.

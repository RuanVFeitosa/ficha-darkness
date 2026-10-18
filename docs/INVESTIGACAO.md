# Murais de investigação

## Acesso

- **Página do Jogador → Investigação:** o seletor de espaço abre o mural pessoal ou o de uma campanha vinculada aos personagens do perfil. Os documentos e evidências existentes continuam disponíveis abaixo do mural.
- **Painel do Mestre → Campanhas → abrir campanha → Mural de investigação:** o mestre prepara cartões ocultos e decide quando revelá-los. Em campanhas locais de demonstração, abra o mural pelo mestre depois de alterar os vínculos dos personagens para atualizar o acesso.

Cartões podem representar pessoas, lugares, pistas e acontecimentos, com texto e imagem PNG/JPEG/WebP. Use **Conectar cartões** para desenhar fios com rótulos. Arraste os cabeçalhos, use as setas do teclado no cabeçalho ou os controles de posição do cartão selecionado. Zoom, busca e a lista de cartões ajudam a navegar em murais maiores.

O mural pessoal pertence ao perfil do jogador, e não a um único personagem. No compartilhado, participantes podem acrescentar cartões e conexões e reorganizar os cartões visíveis. Cada jogador edita/exclui seu próprio conteúdo; o mestre pode administrar todo o mural. A exclusão de um cartão remove também suas conexões.

## Persistência e publicação

As rotas `POST /api/investigacao/pessoal/:codigo` e `POST /api/investigacao/campanha/:id` usam o backend existente configurado em `REACT_APP_API_URL`. O mural não usa um fallback silencioso para armazenamento no navegador.

- Sem Supabase, os dados ficam em `backend/data/investigacao/` (ou em `DATA_DIR/investigacao/`). Eles são armazenados fora da lista de personagens.
- Com Supabase configurado no backend, aplique [a migração de murais](../supabase/migrations/20261018043344_murais_investigacao.sql) antes de publicar a atualização do backend. A tabela tem RLS habilitada e acesso direto revogado para os clientes. Somente o backend usa a chave de serviço já configurada.
- O banco remoto não foi alterado por esta implementação. A migração foi preparada no repositório.
- O backend usa o acesso por código já adotado pelo site: o código do perfil identifica o jogador. Para a administração, `MESTRE_PASSWORD` pode definir no servidor a senha de mestre; ela deve corresponder ao acesso configurado no frontend em `constants/masterAccess.js`. Esta funcionalidade não introduz um sistema de contas diferente.

O backend valida a participação consultando `membros_campanha` quando usa Supabase. Pistas ocultas e conexões com elas são removidas da resposta dos jogadores; não são apenas escondidas com CSS.

As atualizações enviam a revisão do mural. Se outra pessoa já alterou o conteúdo, a API responde com conflito: use **Atualizar mural** e envie de novo. O formulário aberto conserva os campos. Uma consulta a cada dez segundos, enquanto a página estiver visível, recebe mudanças e revelações do grupo.

## Limites e verificação

Cada mural aceita até 150 cartões e 300 conexões. Imagens de até 8 MB são reduzidas no navegador antes do envio e limitadas novamente pela API.

```bash
node --test backend/investigacao.test.cjs
npm run test --workspace frontend -- --watchAll=false --runTestsByPath src/components/campanha/MuralInvestigacao.test.jsx src/pages/PaginaJogador.test.jsx
npm run build
```

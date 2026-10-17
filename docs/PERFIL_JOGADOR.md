# Perfil do Jogador

Acesse `/?jogador=novo` para criar um perfil. O painel inicial recebe o Código do Jogador (4 a 8 dígitos). Ao entrar com um código antigo, o perfil é criado com as fichas Darkness e ESPIRAL correspondentes. Outros personagens são vinculados explicitamente pelo sistema e pelo código da ficha. Personagens criados durante uma sessão de jogador são vinculados automaticamente; falhas de conexão deixam o vínculo pendente neste dispositivo para reenvio ao abrir o perfil.

O backend disponibiliza `GET /api/jogadores/:codigo` e `PUT /api/jogadores/:codigo`. Perfis usam registros `__jogador_<codigo>` no armazenamento já configurado (Supabase ou arquivos JSON), sem alterar o esquema. Esses registros não aparecem na listagem de personagens nem são acessíveis pelas rotas de ficha. O código continua sendo o mecanismo de acesso do projeto; não há autenticação de conta adicional nesta implementação.

A galeria oferece fundos branco e escuro, silhuetas e revelação por mouse, foco de teclado ou toque. O tema é salvo no perfil. As fotos atuais são usadas no retrato revelado; a silhueta padrão permite apresentar também retratos sem fundo transparente.

A investigação reúne as campanhas vinculadas às fichas e mostra apenas documentos revelados para todos ou para um dos personagens do perfil. Reutiliza o PC moderno, terminal e toca-fitas existentes. Imagens aparecem sobre uma mesa, com o visualizador de zoom; vídeos e PDFs têm visualizadores próprios. As permissões de armazenamento e do banco continuam sendo as existentes no projeto.

As builds permitem pesquisar habilidades e especialidades Darkness, habilidades ESPIRAL, combinar itens dos dois sistemas, anotar estratégias, salvar, reabrir, editar e excluir planos. O resgate reabre o plano; a aquisição e o gasto de pontos continuam pelos fluxos de evolução das fichas. Não há compra automática nem validação automática de elegibilidade da build inteira.

Perfis e builds são persistidos no backend. As fichas ESPIRAL continuam usando o armazenamento local existente e precisam estar presentes no dispositivo para carregar; esta mudança não migra as fichas ESPIRAL para a nuvem.

Para disponibilizar os livros, configure `REACT_APP_LIVRO_DARKNESS_URL` e `REACT_APP_LIVRO_ESPIRAL_URL` antes de compilar o frontend. Não foram encontrados PDFs dos livros no repositório. Sem URL, cada livro informa que ainda não está disponível.

Validação: `node --test backend/jogador.integration.test.cjs` e `npm run test --workspace frontend -- --watchAll=false --runInBand --runTestsByPath src/services/jogadorApi.test.js src/pages/PaginaJogador.test.jsx src/pages/cadastroPersonagem.test.jsx`.

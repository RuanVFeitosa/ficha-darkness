# Mecânicas Especiais

Disponíveis no botão **Mecânicas especiais** dos tabletops 2D e 3D. No 2D, use **Mostrar interface** se os controles estiverem recolhidos. Um resumo do evento aparece sobre o tabletop e abre o mesmo painel para mestre e jogadores.

O painel abre na lateral, como as evidências, mantendo a cena visível e os controles do tabletop disponíveis. **Recolher** mantém apenas o cabeçalho, preservando formulários e edições em andamento; **Restaurar** reabre o conteúdo. **Ampliar/Compactar** alterna a largura. O painel tem sua própria rolagem e não escurece nem bloqueia a área externa. Em telas pequenas, ocupa a parte inferior da tela.

## Uso

1. Como mestre, escolha **Preparar mecânica**, um modelo e um nome.
2. Escreva regras e objetivos compartilhados. Opcionalmente selecione uma cena de referência.
3. Configure os parâmetros e salve a preparação.
4. Escolha **Iniciar mecânica** quando chegar o momento. Só um evento pode ficar em andamento ou pausado por campanha.
5. Registre as ações no painel. É possível pausar, retomar ou declarar o resultado. Eventos encerrados mantêm seus contadores e histórico.

A cena selecionada serve como referência; trocar de cena não inicia nem encerra o evento. Uma preparação não aparece no painel dos jogadores. Os dados seguem o modelo de acesso por código da campanha; este campo compartilhado não deve conter anotações secretas do mestre.

## Modelos

**Revolta:** operação simultânea de três frentes por Brasília, com quatro posições por rota, Fôlego, apoio entre grupos, reações militares e três objetivos finais na sede do governo. Consulte [Revolta](revolta.md) para a sequência de rodadas e os detalhes dos benefícios.

**Tower Defense:** integridade da base, recursos iniciais, quantidade de ondas, inimigos iniciais e crescimento por onda, recompensa, dano por invasor e custo de defesa. O mestre inicia a onda, resolve os movimentos e ataques com os tokens normais do mapa e registra **Inimigo derrotado** ou **Invasor atingiu a base**. Depois de resolver todos, **Concluir onda** entrega a recompensa uma única vez. A última onda concluída dá vitória; integridade zero dá derrota. Construir debita recursos e registra uma defesa nomeada; destruir não reembolsa. Não há geração automática de tokens, caminhos ou ataques de torres nesta versão.

**Desafio de progresso:** contadores de progresso e perigo, ambos iniciando em zero. Atingir a meta de progresso dá vitória; atingir o limite de perigo dá derrota. Adequado para perseguições, fugas, rituais e desafios coletivos.

**Personalizada:** regras, lista de objetivos e até oito contadores no formato `Nome:limite`, um por linha, iniciando em zero. O mestre decide quando encerrar ou declarar o resultado.

## Estado e integração

As mecânicas têm uma DT própria de ABSOLUTO (1–5), sem herdar a dificuldade da cena. Na Revolta, o mestre define uma DT por frente e designa os jogadores. As ações aparecem diretamente no tabletop; escolher uma delas realiza o teste da ficha pronta do grupo, sem consultar a ficha pessoal. Os modelos das três frentes e seus testes por ação são editáveis pelo mestre. Consulte [Revolta](revolta.md).

- Motor independente de renderização: `frontend/src/utils/specialMechanics.js`.
- Componentes compartilhados: `frontend/src/components/tabletop/SpecialMechanics.jsx`.
- Estado versionado em `campanhas.mecanicas_especiais`, com leitura pelas assinaturas e recargas existentes da campanha.
- Cada escrita compara a revisão anterior; conflito não confirma a ação e atualiza o painel para uma nova tentativa.
- Falhas de conexão mantêm o estado anterior e exibem erro; a interface só confirma ações depois do salvamento.
- Demonstrações usam o armazenamento local e os eventos existentes da campanha; campanhas distintas mantêm estados separados.
- A migração `20261101153727_mecanicas_especiais_campanha.sql` adiciona a coluna, o valor inicial e a validação de formato sem alterar políticas de acesso existentes.

Para adicionar modelos, registre-os em `MECHANIC_TYPES`, defina sua criação e ações no motor, acrescente os campos e a apresentação no painel e cubra as regras com testes. Os mapas 2D e 3D continuam utilizando o mesmo estado.

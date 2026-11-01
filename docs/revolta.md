# Revolta — ações no tabletop e fichas de grupo

No tabletop 2D ou 3D, o jogador designado vê um quadro de ações diretamente sobre o mapa ou a cena. Não é necessário abrir Mecânicas Especiais. O botão **Quadro** abre os detalhes; **Recolher** reduz o controle durante a narração.

## Preparação pelo mestre

1. Abra **Mecânicas especiais → Preparar mecânica → Revolta**.
2. Selecione as fichas vinculadas à campanha para cada frente. Uma ficha só pode pertencer a uma frente; vários jogadores podem compartilhar a frente.
3. Defina a DT da frente (1–5), independente da cena, e os nomes dos quatro locais.
4. Em **Ficha pronta**, confira ou edite Atributos, Domínios e qual teste cada ação usa. Os modelos iniciais são sugestões editáveis da sessão, não estatísticas oficiais do livro.
5. Inicie a operação. Para configurar uma operação existente, use **Designar jogadores, DTs e locais**, antes das escolhas da rodada.

As três fichas prontas têm Atributos básicos 2, com uma especialidade em 3, e Domínios básicos 1, com uma especialidade em 2:

| Frente | Atributo de especialidade | Domínio de especialidade | Teste padrão de avanço |
| --- | --- | --- | --- |
| Popular | Vontade | Influência | Influência |
| Comunicações | Inteligência | Razão | Razão |
| Suprimentos | Fortitude | Vigor | Vigor |

Essas fichas são compartilhadas pelo grupo e não dependem de atributos, recursos ou disponibilidade da ficha pessoal do jogador. Eventos antigos recebem os modelos padrão automaticamente. O mestre pode editar as fichas antes das escolhas; depois do primeiro teste, fichas, DTs e designações ficam travadas até a próxima rodada.

## Escolha e rolagem

Cada frente começa em 0/4, com Fôlego 4 e máximo 6. Conquistar a quarta posição abre seu acesso à sede. Na tela do jogador:

- **Avançar:** escolhe a ação e rola o teste configurado da frente. Sucesso conquista a próxima posição; falha mantém a posição e perde 1 de Fôlego.
- **Reorganizar:** rola a ficha do grupo. Sucesso recupera 1 de Fôlego (máximo 6); falha mantém o Fôlego.
- **Apoiar:** pede outra frente e então rola. Sucesso reserva +1 dado para o próximo avanço que ainda não foi rolado; falha não concede bônus. Dois grupos não podem escolher apoiar o mesmo alvo na mesma rodada.
- **Defender:** fica disponível quando há contra-ataque. Sucesso mantém a posição; falha recua um local.
- **Recuar:** responde ao contra-ataque abandonando um local. A retirada é executada independentemente do resultado do teste registrado.

O painel mostra o teste, a reserva de dados e a DT antes do clique. Depois, mostra dados, êxitos e resultado, usando o rolador normal de ABSOLUTO. Avançar recebe +1 dado se o Fôlego estiver em 4–6, mais até um bônus reservado de apoio; uma posição fortificada retira um dado. Os limites normais de reserva são respeitados.

Fôlego 0 permite reorganizar, salvo resposta obrigatória a um contra-ataque. Uma frente que chegou à sede pode reorganizar ou apoiar. Bloqueio de comunicação impede oferecer ou receber apoio naquela rodada e suspende bônus reservados, sem apagá-los.

## Simultaneidade

O teste é realizado ao escolher a ação, mas seus efeitos aguardam o fechamento das três escolhas. O mestre usa **Travar escolhas e resolver rodada** para aplicar os resultados em conjunto. O grupo não pode descartar ou repetir um teste já realizado para tentar obter outro resultado. Qualquer integrante designado pode fazer a escolha, mas existe um único teste compartilhado por frente e rodada.

Os apoios conquistados não alteram retroativamente testes já rolados. São guardados para um avanço posterior, no máximo +1 dado por teste. Bônus de rota também ficam reservados. Em escritas simultâneas, o salvamento reaplica a ação ao estado mais recente conservando os mesmos números aleatórios.

O mestre distribui os benefícios da segunda posição, encerra a rodada e anuncia uma reação para a seguinte. **Reforços** fortifica a próxima posição até sua conquista; **Contra-ataque** exige defesa ou retirada; **Bloqueio de comunicação** impede apoio por uma rodada. Cada rodada tem uma reação anunciada.

## Benefícios e final

Popular recupera 1 de Fôlego de outra frente ao conquistar a segunda posição. Comunicações e Suprimentos concedem um bônus reservado de +1 dado a outra frente que ainda tenha posições para conquistar. Cada benefício é obtido uma única vez, mesmo após recuar e reconquistar o local.

Quando as três frentes chegam à sede e a rodada é encerrada, o jogador recebe **Rolar objetivo final**, usando o teste configurado da ficha do grupo e sua DT própria:

| Frente | Objetivo |
| --- | --- |
| Popular | Abrir os portões e proteger a entrada da população. |
| Comunicações | Tomar a transmissão e anunciar a queda do comando. |
| Suprimentos | Bloquear a fuga da cúpula e desarmar a segurança restante. |

Os três objetivos precisam ter sucesso para declarar vitória. Uma falha mantém o objetivo pendente. Integridade e recursos pessoais não são alterados por essas rolagens de grupo.

## Compatibilidade e integração

O estado continua em `campanhas.mecanicas_especiais`, sem outra migração. O modelo existente de acesso por campanha e identidade da ficha permanece. Eventos/rodadas antigos ainda podem ser resolvidos pelo controle de ação pendente, agora usando a ficha pronta do grupo. Frentes sem jogadores designados mantêm controles do mestre.

- Fichas e testes padrão: `frontend/src/utils/revoltGroupSheets.js`.
- Regras da operação: `frontend/src/utils/revoltMechanic.js`.
- Validação das ações do jogador: `frontend/src/utils/mechanicParticipation.js`.
- Salvamento com revisão e repetição preservada: `frontend/src/services/mechanicActions.js`.
- Controles na tela do jogador: `frontend/src/components/tabletop/RevoltPlayerHUD.jsx`.
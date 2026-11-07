# Absoluto 1.0 no Darkness

A evolução concede 20 pontos de Integridade por nível após o primeiro, compartilhados entre as oito regiões: NV4 concede 60 e NV10 concede 180. Gastos antigos continuam registrados e a Integridade já aplicada é preservada; fichas que gastaram acima do novo orçamento não recebem novos pontos disponíveis até que a progressão alcance seus gastos.

O escudo do mestre nas mesas 2D e 3D oferece Nova Cena para todas as fichas vinculadas. A ação zera Medo, bônus e bloqueio de Proteger-se, Ruptura e o marcador de recompensa por cena; também limpa os ajustes locais da próxima rolagem nas fichas abertas. Mantém os valores atuais de Integridade, Sanidade e Esperança, bem como habilidades, Ritos, efeitos ativados pelos jogadores e seus registros de uso. Não renova limites de sessão.

As consequências do Medo são cumulativas e se aplicam contra a fonte: I impede vantagens por ajuda de aliados; II mantém I; III remove 1 dado apenas dos testes de Domínio; IV impede Esforço; V remove o bônus de Esquiva sem alterar a Defesa Base; VI exige escolher fugir, buscar abrigo ou proteger-se no início do turno. Clicar em Enfrentar o Medo em VI gasta imediatamente 5 Esperança e reduz o Medo para II, liberando os controles de Esperança e removendo as correntes. Sem 5 Esperança, a escolha fica indisponível. O custo não é cobrado novamente nas rolagens. A escolha narrativa do turno fica com o jogador; a ficha controla a escolha e o custo ao rolar contra a fonte. A ajuda de aliados é informada separadamente dos outros ajustes de dados. A Ruptura existente ao chegar a VI continua aplicável.

A Defesa base de todos os jogadores é 2 Êxitos e aumenta pela Mobilidade: 0–2 → 2, 3–4 → 3, 5 → 4. Todas as classes têm acesso às reações básicas de Esquiva (+1 Defesa temporária, podendo alcançar 5) e Bloqueio (Proteção com equipamento adequado, reduz dano conforme o Vigor: 0–2 → 5, 3–4 → 10, 5 → 15). A ficha exibe Defesa Base, Esquiva e Bloqueio automaticamente. Reflexos define a quantidade de dados dos testes. Defesa evita acertos, Proteção reduz dano sem aumentar a Defesa e Integridade permite suportar ferimentos.

Base: Protocolo Absoluto v1.0, acrescido dos esclarecimentos do autor nesta conversa.

## Regras consolidadas

- Atributos: 0–5. O Atributo determina a quantidade de d6. Atributo 0 impede teste convencional.
- Domínios: 0–5. Não adicionam dados. Determinam as faces que contam como Êxito.
- Inexperiente: apenas 6. Treinado: 5–6. Especialista: 5–6 e um único 4. Mestre: 4–6. Excepcional: 4–6 e um único 3. Absoluto: 3–6.
- O Êxito adicional limitado vale uma vez na reserva inteira, sem rerrolagem ou dado extra.
- DT/Defesa: 1–5 Êxitos. Dois Finais (6 naturais) só geram Crítico quando o teste tem sucesso.
- Vantagem/Desvantagem: saldo de +1/−1 dado. Esperança permite +1 dado antes do teste ou repetir a reserva por 2 pontos depois. Limite de oito dados; ação possível conserva pelo menos um.
- Criação: 100 EX, Atributos começam em 1 gratuitamente, máximo convencional inicial 3. Custo acumulado 10 EX para 2, 25 EX para 3. Cada nível de Domínio custa 10 pontos.
- Sanidade: 12 + 2 × Vontade. Esperança: 6 + Vontade.
- Integridade: oito regiões independentes, calculadas pela Fortitude, sem PV global.
- Medo, Ruptura, descanso e limites de recuperação narrativa seguem as páginas 21–23.
- Os Passivos deixam de participar das fichas 1.0.

O módulo `frontend/src/data/absolutoV1.js` centraliza os cálculos. Criação, ficha, evolução, modelos e painel do mestre usam essa base.

## Fichas anteriores

A adaptação é explícita e apresenta valores editáveis antes da aplicação. O original é preservado em `legadoAbsoluto`. Não são migrados bônus de Passivos. O servidor impede uma cópia de cliente antigo de reverter uma ficha já adaptada, e a mesclagem de cache não injeta Passivos em fichas 1.0.

A proposta utiliza os modificadores antigos (divisão por dez) para os Atributos. Os vínculos antigos de Firmeza, Carisma, Persistência e Resistência propõem Mobilidade, Influência, Determinação e Vigor. Isso é uma ferramenta de adaptação, não uma regra oficial de conversão. Ferimentos e benefícios permanentes anteriores precisam ser revisados na proposta.

## Consulta e limites do manuscrito

O guia reescrito está em `frontend/src/data/absolutoRegras.js`. A consulta pesquisável contém o texto extraído de 217 páginas com conteúdo, incluindo classes, Arquétipos, Vestígios, ritos, poderes, itens, criaturas, equipamentos e condições. As páginas só com imagens não são pesquisáveis. O texto da fonte é identificado como manuscrito, pois contém regras anteriores contraditórias.

As seções ainda não consolidadas pelo autor permanecem como consulta, sem conversão automática de números: benefícios antigos de classes/Arquétipos e Memento Mori; DT de conjuração e custos dos ritos diante da nova Esperança; fichas antigas do bestiário; desempates resistidos, Sucesso Forte e sequência de ataques. O site não transforma arbitrariamente Defesa 15 em uma DT nem concede +5 na escala de Atributos 0–5.

## Verificação

```powershell
npm run test --workspace frontend -- --watchAll=false --runInBand
node --test backend/absoluto-v1.integration.test.cjs backend/jogador.integration.test.cjs
npm run build
```

Testes cobrem os seis níveis de Êxito, limites dos Êxitos adicionais, Críticos em falhas, reserva independente do Domínio, gastos de Esperança, dano regional, Ruptura, custos, evolução, preservação da ficha anterior e proteção contra sobrescrita por clientes antigos.

## Interface preservada

A ficha mantém a estrutura e os estilos originais: cabeçalho, coluna lateral de recursos/Atributos, abas, linhas de Ativos agora usadas para Domínios, controles regionais e modal de rolagem. Medo foi incorporado como uma barra no grupo existente de Sanidade/Esperança. O painel visual alternativo foi removido. `AbsolutoValores` serve apenas à distribuição na criação e à proposta de migração, sem substituir o layout da ficha.

## Modificadores de dados

Por instrução do autor, cada modificador positivo ou negativo equivale a +1 ou −1 dado. O teto global é oito dados por rolagem, inclusive dano, cura, armas, fórmulas personalizadas e Crítico. Domínios não aumentam a reserva. O teto é aplicado depois dos ajustes e antes de alocar ou rolar dados. Custos, recursos, medidas, durações e progressão não são convertidos em bônus. Catálogos, árvores personalizadas e conteúdos de fichas salvas são normalizados sem alterar a cópia histórica em `legadoAbsoluto`. ESPIRAL conserva suas próprias regras.

A evolução de Atributos usa custos acumulativos: 1→2: 10 EX; 2→3: 15 EX; 3→4: 25 EX; 4→5: 30 EX. De 1 para 3 custa 25 EX; de 1 para 5 custa 80 EX.

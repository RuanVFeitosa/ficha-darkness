# Ficha ESPIRAL

Nesta branch, `/` e `?ficha=identificador` abrem a nova ficha. O identificador separa os arquivos locais. `?sistema=darkness` abre a interface anterior. Mesa, loja, mestre e progressão antigos ainda pertencem ao Darkness.

## Regras adotadas

Fonte: `ESPIRAL _ Sistema.pdf`, fornecido pelo usuário, 179 páginas.

- Atributos (pp. 7–22): Pulso, Razão, Sentido e Voz, estágios I–V, d4–d12; criação com 6 pontos e custos acumulados −1/0/1/3/6.
- Recursos (pp. 23–38): graus 0–IV; reserva de 1 + grau, mínimo de um dado após modificadores. Criação: 10 pontos convencionais, custos 0/1/3/6/10 e limite III.
- Controle Mental e Propósito: separados do orçamento convencional na criação (p. 34). O orçamento inicial das resistências não está claramente definido; edição manual com orientação para combinar com o mestre.
- Integridade: **30/35/40/45/50**, conforme p. 40 e escolha explícita do usuário. A tabela divergente 12/15/18/21/24 da p. 163 permanece como alternativa explícita. Mudanças em Pulso preservam o dano acumulado.
- Sanidade e Esperança: máximo 10; Pressão: dados d6 consumidos na rolagem, não uma terceira reserva vital (pp. 135–156).
- Rolagens: maior dado menos dificuldade; margens ≤−3 / −2 a −1 / 0 / 1–2 / ≥3. Domínio detecta dois dados nos respectivos máximos, incluindo dados de Pressão, que integram a reserva. Consequências são decididas em mesa.
- Lesões: região e gravidade registradas manualmente. Integridade e consequências não são aplicadas automaticamente por uma lesão, pois o impacto depende da arma, proteção e contexto.
- Vertentes: sete benefícios de nível I. Obstinada/Forçar-se têm divergência entre pp. 58 e 154; sem automação dessa regra.
- Habilidades: registro livre de nome, nível, ação, efeito e custo, com orientação para duas escolhas iniciais. Inventário e história também são registros livres.

## Persistência e escopo

Dados salvos em `localStorage`, chave `espiral:sheet:v1:<id>`, com exportação/importação JSON. Não há sincronização com a API, outros jogadores ou dispositivos nesta etapa. Os dados antigos não são convertidos nem sobrescritos. A conversão narrativa descrita nas pp. 76–80 requer escolhas do jogador e mestre.

O histórico recente de rolagens fica em memória. Criação apresenta avisos de orçamento sem impedir ajustes de personagens veteranos. Não há compra automática de evolução, catálogo completo de habilidades ou automação de combate nesta primeira ficha.

## Verificação

`npm run build`

`npm test -- --watchAll=false --runInBand`

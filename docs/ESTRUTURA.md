# Estrutura do projeto

O projeto usa workspaces npm para separar a aplicação React e o servidor Node. Execute os comandos de desenvolvimento a partir da raiz; as configurações de publicação permanecem na raiz.

```text
frontend/
  public/                 Arquivos públicos servidos diretamente
  src/
    App.js                Entrada e integração das telas
    pages/                Telas e rotas da aplicação
    components/
      absoluto/           Cards e resumos do sistema Absoluto
      adaptacao/          Adaptação de personagens para Espiral
      campanha/           Campanhas, anotações e evidências
      espiral/            Componentes específicos do Espiral
      habilidades/        Leitura e edição de habilidades
      jogador/            Perfil, coleção e dossiês do jogador
      midia/              Login, migração e reprodução de mídia
      tabletop/           Mesa, mapa, iluminação e controles de sessão
      tokens/             Arte, personalização e animação de tokens
      ui/                 Componentes compartilhados e diálogos
    styles/               Folhas CSS da aplicação
    data/                 Regras, tabelas e catálogos dos sistemas
      criacao/            Condições e receitas usadas na criação
    constants/            Constantes compartilhadas
    services/             Acesso a APIs, persistência e sincronização
    utils/                Funções de cálculo e transformação
    assets/               Imagens e outros recursos importados
backend/                  API Node e persistência
api/                      Adaptadores serverless legados
cloudflare/               Workers e configuração de mídia
supabase/                 Configuração e arquivos de banco
scripts/                  Comandos mantidos de desenvolvimento
docs/                     Documentação do projeto
archive/development/      Material histórico fora da aplicação
```

## Convenções

- Coloque novos componentes na área correspondente. Use `ui/` para componentes compartilhados entre áreas.
- Mantenha o teste ao lado do módulo (`Componente.test.jsx` ou `modulo.test.js`). Os testes existentes conservam esse padrão.
- Coloque dados e regras em `data/`, não dentro de `components/`. Cálculos reutilizáveis ficam em `utils/`.
- Use `styles/` para folhas de estilo de telas e áreas. Estilos já exclusivos de um componente podem continuar junto dele, como o reprodutor e o modal de descrição.
- `pages/` continua sendo a entrada das telas: mudanças de organização não alteram URLs nem nomes de parâmetros de fichas.
- Não copie regras para cada sistema ou tela. Importe as definições compartilhadas de `data/`.
- Arquivos gerados, logs e rascunhos ficam em `tmp/` ou `work/` e não entram no Git. Material antigo já versionado foi preservado em `archive/development/`.
- Mantenha segredos e dados locais fora do código. Esta organização não modifica credenciais, arquivos de personagem nem configurações de publicação.

## Verificação

```bash
npm run build
npm run test --workspace frontend -- --watchAll=false
```

`npm run dev` inicia o frontend e o backend; os demais comandos estão no [README](../README.md).

# Deploy da Ficha Darkness

Este projeto sobe como um unico Web Service Node: o backend serve a API e tambem entrega o build do React.

## Render

1. Suba a branch `main` para o GitHub.
2. Entre em https://dashboard.render.com.
3. Clique em `New` e escolha `Blueprint`.
4. Selecione o repositorio `RuanVFeitosa/ficha-darkness`.
5. Confirme o arquivo `render.yaml`.
6. Aguarde o build e abra a URL `onrender.com` gerada.

O arquivo `render.yaml` configura:

- Build command: `npm install && npm run build`
- Start command: `npm run backend`
- Node: `22`
- Dados persistentes em `DATA_DIR=/opt/render/project/src/storage`
- Disco persistente de 1 GB no caminho `/opt/render/project/src/storage`

## Importante

As fichas sao salvas em JSON no backend. Em hospedagem publica, use disco persistente ou banco de dados. Sem armazenamento persistente, as fichas podem sumir quando o servidor reiniciar ou redeployar.

Na Render, disco persistente normalmente exige plano pago. Para teste rapido sem persistencia garantida, voce pode criar um Web Service sem disco, mas nao use isso como armazenamento final da mesa.

## Teste local antes do deploy

```bash
npm run build
npm run backend
```

Abra:

```txt
http://localhost:4000
```

Em desenvolvimento, use:

```bash
npm run dev
```

E abra:

```txt
http://localhost:3000
```

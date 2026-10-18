# TODO - Redução de Fast Origin Transfer (Vercel)

- [x] Atualizar `backend/server.js`:
  - [x] Implementar `ETag` (hash do body JSON) e responder `304 Not Modified` quando `If-None-Match` bater
  - [x] Adicionar `Cache-Control` para rotas GET read-heavy
    - [x] `/api/loja/catalogo`
    - [x] `/api/arvores-habilidades`
    - [x] `/api/personagem` / `/api/personagens/:id` (TTL curto)
    - [x] `/api/personagens` (TTL curto)
  - [x] Garantir que rotas mutáveis (POST/PUT/DELETE) não recebam cache


- [ ] (Opcional) Ajustar `vercel.json` para cache de `/api/*` se necessário

- [ ] Testar via `curl -i`:
  - [ ] Obter `ETag` nos GET
  - [ ] Repetir request com `If-None-Match` e confirmar `304`


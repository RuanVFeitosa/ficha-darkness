# Acesso temporário ao backend local

Preparado em 03/11/2026. O backend local responde em `http://127.0.0.1:4000`.
O cliente oficial `cloudflared` foi baixado em `tmp/tunnel/cloudflared.exe`,
fora dos arquivos versionados. Nenhum túnel foi iniciado.

## Escopo a autorizar

Um Quick Tunnel publica o serviço da porta 4000 em uma URL HTTPS temporária
`*.trycloudflare.com`, passando pela rede da Cloudflare. Isso inclui as fichas
locais e os endpoints de leitura, gravação e exclusão existentes. A API atual
não exige autenticação geral nessas rotas: conhecer a URL permite fazer chamadas.
O CORS não substitui autenticação. A URL não deve ser divulgada fora do grupo.

A abertura foi bloqueada pela revisão automática de segurança, pendente de
aprovação específica desse escopo. Não executar até resolver essa aprovação.

## Após autorização

1. Confirmar `http://127.0.0.1:4000/api/health`.
2. Iniciar `cloudflared tunnel --url http://127.0.0.1:4000 --no-autoupdate`.
3. Validar `/api/health` na URL HTTPS gerada.
4. Só após validar os dados locais que os jogadores usarão, atualizar
   `REACT_APP_API_URL` na hospedagem do frontend para `https://URL-GERADA/api`
   e publicar um novo build. Não presumir que os dados do Render já estão locais.
5. Manter o computador ligado, conectado à internet, com backend e túnel ativos.
   Encerrar o túnel revoga essa URL. Reiniciá-lo pode gerar um endereço diferente.

O Quick Tunnel é temporário, para testes: não oferece garantia de disponibilidade,
tem limite de 200 requisições simultâneas e não suporta SSE. A sincronização de
fichas consultada neste projeto usa polling, não SSE.

## Redução de tráfego preparada

- Respostas JSON maiores negociam gzip quando o cliente aceita.
- O frontend revalida leituras com ETag e aceita 304 sem retransmitir o corpo.
- O CORS permite `If-None-Match` e expõe `ETag`.
- As mudanças precisam ser publicadas para afetar o frontend hospedado e o Render.
- O consumo real depende de imagens, número de jogadores e frequência de uso.
  As otimizações não desbloqueiam o workspace suspenso nem repõem a franquia.

Referência oficial: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/

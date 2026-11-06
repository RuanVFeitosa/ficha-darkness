# Redução de transferência HTTP

O painel de banda mede bytes transferidos, não espaço ocupado no banco. O uso
acumulado do período não diminui depois de uma otimização.

O backend comprime JSON com gzip quando o cliente aceita e o corpo tem pelo
menos 1 KB. As leituras JSON bem-sucedidas recebem ETag; uma revalidação com
conteúdo inalterado responde 304, sem transferir novamente o corpo. Rotas sem
política específica usam cache privado com revalidação obrigatória.

O cliente de personagens reutiliza os corpos revalidados, agrupa consultas
simultâneas para a mesma URL e entrega cópias independentes aos componentes.
Gravações invalidam o cache e impedem que consultas anteriores à gravação
alimentem esse cache. Falhas de rede permitem nova tentativa normalmente.

GETs sem cabeçalhos personalizados dispensam Content-Type. A autorização de
preflight CORS pode ser reutilizada por 600 segundos; revalidações com
If-None-Match ainda podem exigir preflight.

Para ativar, publique o backend e faça um novo build/deploy do frontend.
Compare a transferência diária depois da publicação usando uma quantidade
semelhante de sessões. No Network do navegador, confira Content-Encoding: gzip
em respostas grandes e status 304 nas consultas repetidas sem mudanças.
Não é possível garantir ficar abaixo de 5 GB sem medir a carga real.

Verificação local:

```powershell
node --test backend/bandwidth.test.cjs
$env:CI='true'
npm run test --workspace frontend -- --watch=false --runInBand --runTestsByPath src/services/personagemApi.bandwidth.test.js
```

O teste sintético usa texto repetitivo para validar a compressão; sua taxa de
redução não representa imagens, arquivos já comprimidos ou a carga real.

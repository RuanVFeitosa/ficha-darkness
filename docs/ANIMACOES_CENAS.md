# Animação de cenas narrativas

No tabletop, abra **Cenas → Editar → Animação** e escolha a imagem. O botão **Animar** ao lado de uma imagem na aba **Cena** abre diretamente seus controles. No dashboard de campanhas, o mesmo editor aparece sob cada imagem da cena. Se a imagem acabou de ser enviada pelo tabletop, salve a cena e abra a edição novamente para animá-la.

Ative **Animar personagem ou boss nesta imagem**, escolha um preset (Sutil, Boss ou Sobrenatural) e ajuste respiração, balanço e velocidade. A prévia mostra o movimento antes de salvar. Cada imagem tem configuração independente; mapas não recebem esses efeitos.

## Piscada opcional

Envie uma versão da mesma ilustração com os olhos fechados. Preserve o enquadramento e as proporções da arte original. Use **Delimitar olhos** para selecionar a região onde a segunda imagem aparece e **Alinhar olhos fechados** para ajustar posição e escala. Depois, ajuste intervalo e duração da piscada. Sem essa imagem, apenas o movimento da ilustração é aplicado.

O movimento afeta a imagem inteira: ele não gera novos quadros nem separa automaticamente rosto, cabelo ou cenário em camadas.

## Salvamento e reprodução

Salve a cena normalmente. A animação fica no campo `animation` de cada entrada de `imagensCena` / `imagens_cena`, que já é JSON. Não há nova migração de banco.

Na persistência online, imagens auxiliares da animação passam pelo armazenamento de mídia existente. A configuração acompanha a cena para os jogadores e funciona tanto na mesa 2D quanto nas apresentações narrativas da mesa 3D. A reprodução respeita a preferência de movimento reduzido do dispositivo. Desative a caixa de animação para voltar à apresentação estática.

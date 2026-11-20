// Os identificadores históricos permanecem estáveis para fichas e builds salvos.
// A apresentação do repertório Darkness não expõe a classificação anterior.
export const darknessAbilityName = name => String(name || '').split(' · ')[0].replace(/\bAbsoluto\b/g, 'Total').replace(/\bAbsoluta\b/g, 'Total');

import { RESOURCES, freshSheet, integrityMax } from "../data/espiral";

const number = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
const maximum = (values) => Math.max(0, ...values.map(number));

// A escala antiga usa dezenas para os atributos e valores pequenos para
// perícias. Esta é a tabela de adaptação entregue com a ficha ESPIRAL.
export const stageFromDarknessAttribute = (value) => {
  const score = number(value);
  if (score >= 40) return 5;
  if (score >= 30) return 4;
  if (score >= 20) return 3;
  if (score >= 10) return 2;
  return 1;
};

export const gradeFromDarknessSkill = (value) => Math.min(4, Math.floor(number(value) / 5));

export const adaptationResourceSources = {
  Armas: ['lutar', 'combate'], Pontaria: ['precisao', 'armasDeFogo'],
  Atletismo: ['folego', 'equilibrio', 'velocidade'],
  'Sobrevivência': ['rastreamento', 'instintoSobrevivencia'],
  'Investigação': ['investigacao', 'raciocinioLogico', 'memoria'],
  Medicina: ['primeirosSocorros', 'conhecimentoMedico'], 'Técnica': ['conhecimentoTecnico'],
  Tecnologia: ['tecnologia', 'hacking'], 'Influência': ['diplomacia', 'intimidacao', 'empatia'],
  'Dissimulação': ['enganacao', 'manipulacao'], 'Subterfúgio': ['furtividade', 'crime'],
  'Condução': ['pilotagem', 'direcao'],
  'Controle Mental': ['resiliencia', 'resistenciaMental', 'disciplina', 'autocontrole'],
  'Propósito': ['persistencia', 'coragem', 'fe', 'lealdade'],
};
const resourceValue = (character, keys) => maximum(keys.flatMap(key => [
  character.habilidadesPassivas?.[key], character.pericias?.[key], character.habilidadesCombate?.[key],
]));

const legacyInjuries = (character) =>
  Object.entries(character?.membros || {}).flatMap(([region, member]) => {
    if (!member?.ferido && !member?.grave) return [];
    const names = {
      cabeca: "Cabeça", torso: "Torso", bracoEsquerdo: "Braço esquerdo",
      bracoDireito: "Braço direito", pernaEsquerda: "Perna esquerda", pernaDireita: "Perna direita",
    };
    return [{ id: `darkness-${region}`, region: names[region] || region, severity: member.grave ? "Grave" : "Moderada", note: "Migrada da integridade regional do Darkness." }];
  });

const legacyAbilities = (character) => [
  ...(character?.marcas || []).map((item) => item?.nome || item?.name || String(item || "")).filter(Boolean),
  ...(character?.rituais || []).map((item) => item?.nome || item?.name || String(item || "")).filter(Boolean),
  ...(character?.poderesAbsolutos || []).map((item) => item?.nome || item?.name || String(item || "")).filter(Boolean),
].join("\n");

export function convertDarknessToEspiral(character = {}, { pulseSource = "maior" } = {}) {
  const attributes = character?.atributos || {};
  const legacyInventory = Array.isArray(character.inventario) ? character.inventario : [];
  const pulse = stageFromDarknessAttribute(pulseSource === "maior" ? Math.max(number(attributes.forca), number(attributes.fonitude)) : attributes[pulseSource]);
  const resources = Object.fromEntries(RESOURCES.map((name) => {
    const keys = adaptationResourceSources[name] || [];
    return [name, gradeFromDarknessSkill(resourceValue(character, keys))];
  }));
  const identity = [character.classe, character.especialidade].filter(Boolean).join(" · ");
  const notes = [
    "ADAPTAÇÃO DARKNESS → ESPIRAL",
    "Atributos e recursos foram calculados pela tabela de adaptação. Sentido usa Reflexos, Voz usa Vontade e Integridade deriva de Pulso. Revise a adaptação conforme a história do personagem.",
    character.anotacao && `Anotações antigas:\n${character.anotacao}`,
    character.historia && `História antiga:\n${character.historia}`,
  ].filter(Boolean).join("\n\n");

  const sheet = {
    ...freshSheet(),
    name: character.nome || "",
    profileImage: character.fotoPerfil || "",
    occupation: identity,
    player: character.jogador || "",
    pronoun: character.pronome || "",
    attributes: {
      pulso: pulse,
      razao: stageFromDarknessAttribute(attributes.inteligencia),
      sentido: stageFromDarknessAttribute(attributes.reflexos),
      voz: stageFromDarknessAttribute(attributes.vontade),
    },
    resources,
    integrityTable: "creation",
    integrity: integrityMax(pulse, "creation"),
    sanity: Math.min(10, Math.round(number(character?.sanidade?.atual) / 10)),
    hope: Math.min(10, Math.round(number(character?.esperanca?.atual) / 10)),
    purpose: character.historia || "",
    notes,
    inventory: legacyInventory.map((item) => item?.nome || item?.name || String(item || "")).filter(Boolean).join("\n"),
    weapons: legacyInventory
      .filter((item) => item?.armaStatus)
      .map((item, index) => ({
        id: `darkness-weapon-${index}`,
        name: item.nome || item.name || "Arma migrada",
        damage: item.armaStatus?.dmg || item.dano || "",
        ammo: item.armaStatus?.mag || item.municaoCarregada?.quantidade || "",
      })),
    protections: legacyInventory
      .filter((item) => item?.categoria === "defesas" || item?.tipo === "Defesa" || number(item?.defesaBonus) > 0 || item?.resistencia)
      .map((item, index) => ({
        id: `darkness-protection-${index}`,
        name: item.nome || item.name || "Proteção migrada",
        value: item.defesaBonus || item.resistencia || "",
        region: Array.isArray(item.membrosProtegidos) ? item.membrosProtegidos.join(", ") : item.areaDefesa || "",
      })),
    abilities: legacyAbilities(character),
    injuries: legacyInjuries(character),
    phase: "campaign",
    migratedFrom: "darkness",
    migratedFromId: character.fichaId || "",
  };
  return sheet;
}

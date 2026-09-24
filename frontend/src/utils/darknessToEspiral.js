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

export const gradeFromDarknessSkill = (value) => Math.min(4, number(value));

const valueFor = (character, keys) =>
  maximum(keys.map((key) => character?.habilidadesPassivas?.[key]));

const combatValueFor = (character, keys) =>
  maximum(keys.map((key) => character?.habilidadesCombate?.[key]));

const resourceValue = (character, passiveKeys, combatKeys = []) =>
  Math.max(valueFor(character, passiveKeys), combatValueFor(character, combatKeys));

const resourceMappings = {
  Armas: [["lutar"], ["violencia"]],
  Pontaria: [["precisao"], ["percepcao"]],
  Atletismo: [["folego", "equilibrio", "velocidade", "vitalidade"], ["firmeza", "resistencia"]],
  "Sobrevivência": [["instintoSobrevivencia"], ["intuicao"]],
  "Investigação": [["investigacao", "raciocinioLogico", "memoria"], ["razao"]],
  Medicina: [["primeirosSocorros", "conhecimentoMedico"], []],
  "Técnica": [["conhecimentoTecnico", "tatica"], []],
  Tecnologia: [["tecnologia"], []],
  "Influência": [["diplomacia", "intimidacao", "intimidacaoPassiva", "empatia", "presenca", "seducao"], ["carisma", "violencia"]],
  "Dissimulação": [["enganacao", "manipulacao"], ["carisma"]],
  "Subterfúgio": [["furtividade", "crime"], ["firmeza"]],
  "Condução": [[], []],
  "Controle Mental": [["disciplina", "autocontrole", "resistenciaMental"], ["persistencia", "resistencia"]],
  "Propósito": [["coragem", "fe", "lealdade"], ["persistencia"]],
};

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

export function convertDarknessToEspiral(character = {}, { pulseSource = "forca" } = {}) {
  const attributes = character?.atributos || {};
  const legacyInventory = Array.isArray(character.inventario) ? character.inventario : [];
  const pulse = stageFromDarknessAttribute(attributes[pulseSource]);
  const social = Math.max(number(attributes.vontade), combatValueFor(character, ["carisma"]));
  const resources = Object.fromEntries(RESOURCES.map((name) => {
    const [passive, combat] = resourceMappings[name] || [[], []];
    return [name, gradeFromDarknessSkill(resourceValue(character, passive, combat))];
  }));
  const identity = [character.classe, character.especialidade].filter(Boolean).join(" · ");
  const notes = [
    "ADAPTAÇÃO DARKNESS → ESPIRAL",
    "Atributos e recursos foram calculados pela tabela de adaptação. Revise Pulso, Sentido e Voz com o mestre: a regra original pede que representem o personagem, não uma média exata.",
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
      sentido: stageFromDarknessAttribute(Math.max(number(attributes.reflexos), combatValueFor(character, ["percepcao"]))),
      voz: stageFromDarknessAttribute(social),
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

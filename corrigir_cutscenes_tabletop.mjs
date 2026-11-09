/**
 * Correção de ativação/replay de cutscenes no Protocolo Darkness.
 * Execute na raiz de ficha-darkness: node corrigir_cutscenes_tabletop.mjs
 * Para apenas verificar: node corrigir_cutscenes_tabletop.mjs --dry-run
 * Fonte conferida: branch main em 2026-11-08.
 */
import fs from 'node:fs';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const tasks = [
  {
    file: 'frontend/src/utils/tabletopScene.js',
    replacements: [
      [
        'export function activeTabletopScene(campaign) {',
        `export function isSpecialSceneAvailable(scene) {
 const special=scene?.cenaEspecial || scene?.cena_especial;
 return Boolean(special && special.ativo !== false && (special.cutscene || special.midiaUrl));
}

export function newSpecialPresentationId() {
 return \`especial:\${Date.now()}-\${Math.random().toString(36).slice(2,10)}\`;
}

export function activeTabletopScene(campaign) {`,
      ],
      [
        "if(campaign.modo==='especial' && special?.ativo && special.midiaUrl)",
        "if(campaign.modo==='especial' && isSpecialSceneAvailable(scene))",
      ],
    ],
  },
  {
    file: 'frontend/src/pages/mesa.jsx',
    replacements: [
      [
        'import { cenaVisivelParaJogador } from "../utils/sceneVisibility";',
        'import { cenaVisivelParaJogador } from "../utils/sceneVisibility";\nimport { isSpecialSceneAvailable, newSpecialPresentationId } from "../utils/tabletopScene";',
      ],
      [
        `  const apresentar = async (cena, modo, midia = null) => {
    setTransicao(true);
    await ativarCena(campanha.id, cena.id, modo, midia?.id || null);
    setTimeout(() => {
      setCampanha((atual) => ({
        ...atual,
        cenaAtiva: cena,
        modo,
        midiaAtivaId: midia?.id || null,
      }));
    }, 350);
    setTimeout(() => setTransicao(false), 1050);
  };`,
        `  const apresentar = async (cena, modo, midia = null) => {
    const midiaId = modo === "especial" ? newSpecialPresentationId() : midia?.id || null;
    setTransicao(true);
    setErro("");
    try {
      await ativarCena(campanha.id, cena.id, modo, midiaId);
      setTimeout(() => {
        setCampanha((atual) => ({
          ...atual,
          cenaAtiva: cena,
          modo,
          midiaAtivaId: midiaId,
        }));
      }, 350);
      setTimeout(() => setTransicao(false), 1050);
    } catch (error) {
      setTransicao(false);
      setErro(error.message || "Não foi possível apresentar a cena.");
    }
  };`,
      ],
      [
        'onClick={() => apresentar(item, "cena")}\n              title="Exibir cena"',
        'onClick={() => apresentar(item, item.cenaEspecial?.cutscene && isSpecialSceneAvailable(item) ? "especial" : "cena")}\n              title={item.cenaEspecial?.cutscene && isSpecialSceneAvailable(item) ? "Reproduzir cutscene" : "Exibir cena"}',
      ],
      [
        'item.cenaEspecial?.ativo && item.cenaEspecial?.midiaUrl && (',
        'isSpecialSceneAvailable(item) && (',
      ],
      [
        '!embedded && campanha.modo === "especial" && cena?.cenaEspecial?.midiaUrl && (',
        '!embedded && campanha.modo === "especial" && isSpecialSceneAvailable(cena) && (',
      ],
      [
        '<SpecialSceneMedia special={cena.cenaEspecial} name={cena.nome} controls={mestre} />',
        '<SpecialSceneMedia key={`${cena.id}:${campanha.midiaAtivaId || "especial"}`} special={cena.cenaEspecial} name={cena.nome} controls={mestre} />',
      ],
    ],
  },
  {
    file: 'frontend/src/pages/Tabletop3D.jsx',
    replacements: [
      [
        'import { activeTabletopScene,specialSceneDestinations } from "../utils/tabletopScene";',
        'import { activeTabletopScene,isSpecialSceneAvailable,newSpecialPresentationId,specialSceneDestinations } from "../utils/tabletopScene";',
      ],
      [
        'const mediaId=mapLink?.id || imageLink?.id || null;',
        'const mediaId=special ? newSpecialPresentationId() : mapLink?.id || imageLink?.id || null;',
      ],
      [
        'onClick={() => switchScene(scene,(scene.imagensCena || []).length ? null : maps[0]?.link || null,(scene.imagensCena || [])[0] || null)}',
        'onClick={() => scene.cenaEspecial?.cutscene && isSpecialSceneAvailable(scene) ? switchScene(scene,null,null,true) : switchScene(scene,(scene.imagensCena || []).length ? null : maps[0]?.link || null,(scene.imagensCena || [])[0] || null)}',
      ],
      [
        'scene.cenaEspecial?.ativo && scene.cenaEspecial.midiaUrl && <button',
        'isSpecialSceneAvailable(scene) && <button',
      ],
      [
        'key={campaign.cenaAtiva.id+activePresentation.media.midiaUrl}',
        'key={`${campaign.cenaAtiva.id}:${campaign.midiaAtivaId || activePresentation.media.midiaUrl || "especial"}`}',
      ],
    ],
  },
  {
    file: 'frontend/src/utils/tabletopScene.test.js',
    replacements: [
      [
        "import { activeTabletopScene,specialSceneDestinations } from './tabletopScene';",
        "import { activeTabletopScene,isSpecialSceneAvailable,newSpecialPresentationId,specialSceneDestinations } from './tabletopScene';",
      ],
    ],
    append: `
test('cutscene ativa sem URL de mídia abre uma cena especial; projeto desativado não abre',()=>{
 const special={ativo:true,tipoMidia:'cutscene',cutscene:{version:1,name:'Abertura',duration:10,layers:[]}};
 expect(isSpecialSceneAvailable({cenaEspecial:special})).toBe(true);
 expect(activeTabletopScene({cenaAtiva:{id:'cutscene',cenaEspecial:special},modo:'especial'})).toEqual({type:'special',media:special});
 expect(isSpecialSceneAvailable({cenaEspecial:{...special,ativo:false}})).toBe(false);
 expect(activeTabletopScene({cenaAtiva:{id:'cutscene',cenaEspecial:{...special,ativo:false}},modo:'especial'}).type).not.toBe('special');
});

test('nova apresentação recebe identificação para reiniciar a cutscene nos espectadores',()=>{
 expect(newSpecialPresentationId()).toMatch(/^especial:\d+-[a-z0-9]+$/);
 expect(newSpecialPresentationId()).not.toBe(newSpecialPresentationId());
});
`,
  },
];

const results = [];
const changes = [];
for (const task of tasks) {
  const full = path.resolve(process.cwd(), task.file);
  if (!fs.existsSync(full)) {
    throw new Error(`Não encontrei ${task.file}. Execute o script na raiz do repositório ficha-darkness.`);
  }
  const original = fs.readFileSync(full, 'utf8');
  // Arquivos salvos no Windows usam CRLF; normalize apenas durante a busca.
  const lineEnding = original.includes('\r\n') ? '\r\n' : '\n';
  let source = original.replace(/\r\n/g, '\n');
  for (const [index, [before, after]] of task.replacements.entries()) {
    if (source.includes(after)) continue; // seguro ao executar novamente
    const count = source.split(before).length - 1;
    if (count !== 1) {
      throw new Error(`${task.file}: ajuste ${index + 1}/${task.replacements.length} não encontrado (${count} correspondências). O código pode ter mudado. Nenhum arquivo foi gravado.`);
    }
    source = source.replace(before, after);
  }
  if (task.append && !source.includes("test('cutscene ativa sem URL de mídia")) {
    source += task.append;
  }
  results.push({file:task.file,changed:source!==original.replace(/\r\n/g, '\n')});
  const output = lineEnding === '\r\n' ? source.replace(/\n/g, '\r\n') : source;
  if (output !== original) changes.push({full,source:output});
}

console.log(`Correção de cutscenes: ${changes.length} arquivo(s) ${dryRun?'seriam modificados':'para atualizar'}.`);
for (const item of results) console.log(`${item.changed?'MODIFICAR':'SEM MUDANÇAS'}  ${item.file}`);
if (dryRun) {
  console.log('Validação concluída. Nenhum arquivo alterado.');
} else {
  for (const {full,source} of changes) fs.writeFileSync(full,source,'utf8');
  console.log('Correções aplicadas. Execute os testes e revise o diff antes do commit.');
}

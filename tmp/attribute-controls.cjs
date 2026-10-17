const fs=require('fs'),p='frontend/src/pages/fichaEspiral.jsx';let s=fs.readFileSync(p,'utf8');s=s.replace('const [attribute, setAttribute] = useState("sentido");','const [attribute, setAttribute] = useState("sentido");\n  const [temporaryStages, setTemporaryStages] = useState({});');s=s.replace('const sides = sheet.attributes[attributeOverride] * 2 + 2;','const sides = Math.min(5, sheet.attributes[attributeOverride] + (temporaryStages[attributeOverride] || 0)) * 2 + 2;\n    setTemporaryStages(previous => ({...previous,[attributeOverride]:0}));');
const start=s.indexOf('                    <select\r\n                      aria-label={`Estágio de ${attr.name}`}');const end=s.indexOf('                    <b',start);if(start<0)throw Error('select não localizado');s=s.slice(0,start)+s.slice(end);
s=s.replace('const stage = sheet.attributes[key];','const baseStage = sheet.attributes[key];\n                const stage = Math.min(5, baseStage + (temporaryStages[key] || 0));');
s=s.replace('<label\r\n                    className={`es-rail-attribute','<div\r\n                    className={`es-rail-attribute');
const a=s.indexOf('<small className="es-rail-stage">ESTÁGIO {stage}</small>');const b=s.indexOf('                  </label>',a);s=s.slice(0,b)+`                    <div className="es-attribute-actions"><button type="button" disabled={rolling} onClick={() => rollAttribute(key)} aria-label={'Rolar somente '+attr.name}>Rolar</button><button type="button" disabled={stage >= 5 || rolling} onClick={() => setTemporaryStages(previous => ({...previous,[key]:(previous[key] || 0)+1}))} aria-label={'Aumentar categoria temporária de '+attr.name}>+ categoria</button>{temporaryStages[key] > 0 && <button type="button" onClick={() => setTemporaryStages(previous => ({...previous,[key]:0}))} aria-label={'Remover aumento temporário de '+attr.name}>↺</button>}</div>
                    {temporaryStages[key] > 0 && <small className="es-attribute-temp">Temporário · próxima rolagem</small>}
                  </div>`+s.slice(b+'                  </label>'.length);
s=s.replace('  function rollFormula() {',`  function rollAttribute(key) {
    if (rolling) return;
    const stage = Math.min(5, sheet.attributes[key] + (temporaryStages[key] || 0));
    const sides = stage * 2 + 2;
    const value = randomDie(sides);
    setAttribute(key);
    setTemporaryStages(previous => ({...previous,[key]:0}));
    setRolling(true);
    setHistory(previous => [{type:'formula',label:ATTRIBUTES[key].name+' · somente atributo',dice:[value],sides,pressure:[],modifier:0,total:value,at:Date.now()},...previous].slice(0,12));
    setRollModalOpen(true);
    window.setTimeout(() => setRolling(false),650);
  }
  function rollFormula() {`);
fs.writeFileSync(p,s);

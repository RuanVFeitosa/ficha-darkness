import { resumoFicha } from './CharacterDossier';
test('resumo Darkness usa vida e recursos da ficha preservando valores zero',()=>{
 const resumo=resumoFicha({sistema:'darkness',dados:{nivel:3,vida:{atual:0,max:40},sanidade:{atual:12,max:20},esperanca:{atual:0,max:10},atributos:{forca:2}}});
 expect(resumo.recursos).toEqual([{nome:'Integridade',atual:0,max:40},{nome:'Sanidade',atual:12,max:20},{nome:'Esperança',atual:0,max:10}]);
 expect(resumo.progresso).toBe('Nível 3');
});
test('resumo ESPIRAL converte estágios em dados e calcula integridade máxima',()=>{
 const resumo=resumoFicha({sistema:'espiral',dados:{attributes:{pulso:5,razao:2},integrity:21,sanity:8,hope:6,pressure:2}});
 expect(resumo.atributos.map(a=>a.valor)).toEqual(['⬢12','⬡6']);
 expect(resumo.recursos[0]).toEqual({nome:'Integridade',atual:21,max:50});
 expect(resumo.progresso).toBe('2 dados de pressão');
});
test('ausência de dados não inventa recursos para a ficha',()=>{
 expect(resumoFicha({sistema:'darkness',dados:{}}).recursos[0].atual).toBeUndefined();
});

const React = require('react');
const {render,screen,fireEvent,within} = require('@testing-library/react');
const CharacterDossier = require('./CharacterDossier').default;
function DossierTest({ficha}){const [aberto,setAberto]=React.useState(false);return <main className="pj pj-dashboard"><CharacterDossier ficha={ficha} aberto={aberto} onToggle={()=>setAberto(v=>!v)}/></main>;}
afterEach(()=>{delete window.matchMedia;});
test('foto no desktop é um link direto para a ficha, sem abrir modal',()=>{
 window.matchMedia=()=>({matches:false});
 render(<DossierTest ficha={{id:'1234',sistema:'darkness',nome:'Ana',dados:{}}}/>);
 const link=screen.getByRole('link',{name:'Abrir ficha de Ana'});
 expect(link).toHaveAttribute('href','?sistema=darkness&ficha=1234');
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test.each(['espiral','darkness'])('toque abre resumo completo %s, com navegação e fechamento',sistema=>{
 window.matchMedia=()=>({matches:true});
 render(<DossierTest ficha={{id:'1234',sistema,nome:'Ana',dados:{attributes:{pulso:2},atributos:{forca:0},membros:{cabeca:{atual:0,max:100}},sanity:0,hope:6,sanidade:{atual:0,max:10},esperanca:{atual:5,max:10}}}}/>);
 fireEvent.click(screen.getByRole('link',{name:'Abrir ficha de Ana'}));
 const modal=screen.getByRole('dialog',{name:'Ana'});
 expect(modal.parentElement.parentElement).toHaveClass('pj-dashboard');
 expect(within(modal).getByRole('link',{name:'Abrir ficha completa ↗'})).toHaveAttribute('href',`?sistema=${sistema}&ficha=1234`);
 if(sistema==='darkness'){expect(within(modal).getByText('Integridade corporal')).toBeInTheDocument();expect(within(modal).getByText('0 / 100')).toBeInTheDocument();}
 else{expect(within(modal).getByText('Status atual')).toBeInTheDocument();expect(within(modal).getByText('Pulso')).toBeInTheDocument();}
 fireEvent.keyDown(modal,{key:'Escape'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(document.body.style.overflow).not.toBe('hidden');
});
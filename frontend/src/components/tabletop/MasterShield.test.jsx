import React from 'react';
import {render,screen,fireEvent,within,waitFor} from '@testing-library/react';
import MasterShield from './MasterShield';
import {commitMechanicAction} from '../../services/mechanicActions';
jest.mock('../../services/mechanicActions',()=>({commitMechanicAction:jest.fn()}));
beforeEach(()=>localStorage.clear());

test('escudo administra os sistemas da campanha e publica alteração no estado da mesa',async()=>{
 const campaign={id:'c',nome:'ATO III',membros:[{ficha_id:'lia',nome:'Lia'}],mecanicasEspeciais:{version:1,revision:0,events:[],optionalSystems:[{id:'survival',kind:'survival',name:'Fome e sede',enabled:true,participants:{lia:{hunger:2,thirst:4}}}]}};
 const saved={...campaign.mecanicasEspeciais,revision:1};
 commitMechanicAction.mockResolvedValue(saved);const onOptionalState=jest.fn();
 render(<MasterShield campaign={campaign} onOptionalState={onOptionalState} campaignSystem="espiral"/>);
 fireEvent.click(screen.getByRole('button',{name:'Sistemas opcionais'}));
 const controls=screen.getByRole('region',{name:'Controles dos sistemas opcionais'});
 expect(within(controls).getByRole('switch',{name:'Ativar Fome e sede'})).toHaveAttribute('aria-checked','true');
 fireEvent.click(within(controls).getByRole('button',{name:'Aumentar Fome de Lia'}));
 await waitFor(()=>expect(onOptionalState).toHaveBeenCalledWith(saved));
 expect(commitMechanicAction).toHaveBeenCalledWith(campaign,expect.anything(),{type:'optionalSurvival',id:'survival',playerId:'lia',key:'hunger',delta:1},expect.objectContaining({master:true}));
 fireEvent.click(screen.getByRole('button',{name:'Cena e participantes'}));
 expect(screen.queryByRole('region',{name:'Controles dos sistemas opcionais'})).not.toBeInTheDocument();
});
test('recebe ferramentas do 3D sem duplicar Cenas e mantém cada ferramenta no escudo',()=>{
 render(<MasterShield extraTools={[['tokens','Tokens'],['weather','Clima'],['background','Fundo'],['dice','Dados'],['flashlight','Lanterna']]} renderTool={tool=><p>Ferramenta {tool}</p>}/>);
 const navigation=screen.getByRole('navigation',{name:'Áreas do escudo'});
 expect(within(navigation).getAllByRole('button',{name:'Cenas',exact:true})).toHaveLength(1);
 expect(within(navigation).queryByRole('button',{name:'Biblioteca'})).not.toBeInTheDocument();
 fireEvent.click(within(navigation).getByRole('button',{name:'Tokens'}));
 expect(screen.getByText('Ferramenta tokens')).toBeVisible();
 fireEvent.click(within(navigation).getByRole('button',{name:'Clima'}));
 expect(screen.getByText('Ferramenta weather')).toBeVisible();
});

test('master tools have icons and preserve their content while changing sections',()=>{
 const renderTool=tool=><label>{tool}<input aria-label={`Rascunho ${tool}`}/></label>;
 render(<MasterShield renderTool={renderTool}/>);
 const navigation=screen.getByRole('navigation',{name:'Áreas do escudo'});
 expect(within(navigation).queryByRole('button',{name:'Combate',exact:true})).not.toBeInTheDocument();
 expect(within(navigation).queryByRole('button',{name:'Investigação',exact:true})).not.toBeInTheDocument();
 expect(screen.queryByRole('textbox',{name:'Rascunho sessionModes'})).not.toBeInTheDocument();
 for(const label of ['Dashboard','Cenas','Anotações','Música','Soundpad']) {
  expect(within(navigation).getByRole('button',{name:label,exact:true}).querySelector('svg')).not.toBeNull();
 }
 fireEvent.click(within(navigation).getByRole('button',{name:'Anotações',exact:true}));
 fireEvent.change(screen.getByRole('textbox',{name:'Rascunho notes'}),{target:{value:'Pista da sessão'}});
 fireEvent.click(within(navigation).getByRole('button',{name:'Soundpad',exact:true}));
 expect(screen.getByRole('textbox',{name:'Rascunho soundpad'})).toBeInTheDocument();
 expect(screen.queryByRole('textbox',{name:'Rascunho notes'})).not.toBeInTheDocument();
 fireEvent.click(within(navigation).getByRole('button',{name:'Anotações',exact:true}));
 expect(screen.getByRole('textbox',{name:'Rascunho notes'})).toHaveValue('Pista da sessão');
});

test('Documentos abre no escudo e mantém o rascunho ao alternar para a cena',()=>{
 render(<MasterShield scene={{nome:'Arquivo'}} documents={<label>Nome da evidência<input aria-label="Nome da evidência"/></label>}/>);
 expect(screen.queryByRole('textbox',{name:'Nome da evidência'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Documentos',exact:true}));
 fireEvent.change(screen.getByRole('textbox',{name:'Nome da evidência'}),{target:{value:'Carta encontrada'}});
 expect(screen.queryByRole('region',{name:'Inimigos e NPCs'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Cena e participantes'}));
 expect(screen.getByRole('region',{name:'Inimigos e NPCs'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Documentos',exact:true}));
 expect(screen.getByRole('textbox',{name:'Nome da evidência'})).toHaveValue('Carta encontrada');
});

test('scene difficulty can be edited inside the shield while enemy defense stays automatic',()=>{
 const save=jest.fn();
 render(<MasterShield campaignSystem="espiral" scene={{nome:'Teste 3',dificuldades:{ambiente:4,combateAmbiente:8,conflitos:6}}} enemies={[{id:'a',nome:'Ameaça',defesa:12}]} onSaveDifficulty={save}/>);
 const panel=screen.getByRole('region',{name:'Dificuldades da cena'});
 const input=within(panel).getByLabelText('Dificuldade de Ambiente da cena');
 fireEvent.change(input,{target:{value:'7'}});fireEvent.blur(input);
 expect(save).toHaveBeenCalledWith({ambiente:7});
 expect(within(panel).getAllByRole('spinbutton')).toHaveLength(3);
 expect(within(panel).getByText('Ameaça')).toBeInTheDocument();
 expect(within(panel).getByText('12')).toBeInTheDocument();
});

test('calcula lesão e testa as margens de ESPIRAL usando as regras da ficha',()=>{
 render(<MasterShield/>);fireEvent.click(screen.getByRole('button',{name:'ESPIRAL'}));
 fireEvent.click(screen.getByText('Resolver um teste'));
 fireEvent.change(screen.getByLabelText('Resultados dos dados'),{target:{value:'6, 4'}});
 fireEvent.change(screen.getByLabelText('Dificuldade da consulta'),{target:{value:'4'}});
 expect(screen.getByLabelText('Resolução da consulta')).toHaveTextContent('Sucesso · margem +2');
 fireEvent.click(screen.getByText('Calcular dano e proteção'));
 fireEvent.change(screen.getByLabelText('Dano bruto'),{target:{value:'10'}});
 fireEvent.change(screen.getByLabelText('Proteção / RD'),{target:{value:'3'}});
 expect(screen.getByLabelText('Dano líquido')).toHaveTextContent('7 de Impacto · Grave');
});
test('anotações e progresso são privados e separados por campanha',()=>{
 const view=render(<MasterShield campaignId="a"/>);
 fireEvent.click(screen.getByText('Relógio de progresso e notas privadas'));
 fireEvent.change(screen.getByLabelText('Anotações do mestre'),{target:{value:'A pista está na biblioteca.'}});
 fireEvent.click(screen.getByRole('button',{name:'Avançar progresso'}));
 expect(screen.getByLabelText('Progresso do relógio')).toHaveTextContent('1 / 6');
 view.unmount();render(<MasterShield campaignId="b"/>);
 expect(screen.getByLabelText('Anotações do mestre')).toHaveValue('');
 expect(JSON.parse(localStorage.getItem('darkness:master-shield:a:notes'))).toBe('A pista está na biblioteca.');
});
test('Absoluto resolve Êxitos e Crítico sem usar a regra de margem do ESPIRAL',()=>{
 render(<MasterShield/>);
 fireEvent.click(screen.getByText('Resolver um teste'));
 fireEvent.change(screen.getByLabelText('Dificuldade da consulta'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Resultados dos dados'),{target:{value:'6, 6'}});
 expect(screen.getByLabelText('Resolução da consulta')).toHaveTextContent('Crítico · 2 Êxitos · 2 Finais');
});

test('campaign system overrides the browser preference',()=>{
 localStorage.setItem('darkness:master-shield:system',JSON.stringify('absoluto'));
 render(<MasterShield campaignSystem="espiral"/>);
 expect(screen.queryByRole('navigation',{name:'Sistema do escudo'})).not.toBeInTheDocument();
 expect(screen.getByText(/Maior dado/)).toBeInTheDocument();
 expect(screen.queryByText('Modificadores e limite de dados')).not.toBeInTheDocument();
});
test('Absoluto limits scene DT and displays quick references',()=>{
 const save=jest.fn();
 render(<MasterShield campaignSystem="absoluto" scene={{nome:'Cena',dificuldades:{ambiente:2}}} onSaveDifficulty={save}/>);
 const panel=screen.getByRole('region',{name:'Dificuldades da cena'});
 const input=within(panel).getByLabelText('Dificuldade de Ambiente da cena');
 expect(input).toHaveAttribute('min','1');expect(input).toHaveAttribute('max','5');
 fireEvent.change(input,{target:{value:'9'}});fireEvent.blur(input);
 expect(save).toHaveBeenLastCalledWith({ambiente:5});
 fireEvent.change(input,{target:{value:'0'}});fireEvent.blur(input);
 expect(save).toHaveBeenLastCalledWith({ambiente:1});
 const references=screen.getByRole('complementary',{name:'Referências rápidas'});
 expect(within(references).getByText('Atributos')).toBeInTheDocument();
 expect(within(references).getByText('Domínios')).toBeInTheDocument();
});

const organizedTools=[['exploration','Exploração'],['tokens','Tokens'],['mechanics','Mecânicas especiais'],['weather','Clima'],['background','Fundo'],['dice','Dados'],['flashlight','Lanterna'],['players','Jogadores']];

test('organized 2D shield connects overview shortcuts and groups lighting with scenes',()=>{
 render(<div className="mesa-master-shield-panel"><MasterShield organized campaignSystem="absoluto" combat
  scene={{nome:'Arquivo',dificuldades:{ambiente:1,combateInimigoId:'a'}}}
  enemies={[{id:'a',nome:'Vigia',defesa:3}]} members={[{id:'p',papel:'jogador'}]}
  extraTools={[["players","Jogadores"],["lighting","Iluminação"]]}
  documents={<input aria-label="Rascunho da pista"/>} renderTool={tool=><input aria-label={'Ferramenta '+tool}/>}/></div>);
 expect(screen.getByText('DT 3 · Ambiente do combate')).toBeVisible();
 const overview=screen.getByRole('region',{name:'Resumo dos participantes'});
 fireEvent.click(within(overview).getByRole('button',{name:'Fichas dos jogadores'}));
 expect(screen.getByRole('textbox',{name:'Ferramenta players'})).toBeVisible();
 expect(screen.getByRole('navigation',{name:'Ferramentas de Participantes'})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Cena',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Iluminação',exact:true}));
 expect(screen.getByRole('textbox',{name:'Ferramenta lighting'})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Arquivo',exact:true}));
 fireEvent.change(screen.getByRole('textbox',{name:'Rascunho da pista'}),{target:{value:'Carta'}});
 fireEvent.click(screen.getByRole('button',{name:'Sessão',exact:true}));
 fireEvent.click(within(overview).getByRole('button',{name:'Documentos e pistas'}));
 expect(screen.getByRole('textbox',{name:'Rascunho da pista'})).toHaveValue('Carta');
});
test('organized 3D shield groups tools in six areas and keeps the overview focused',()=>{
 render(<MasterShield organized campaignSystem="espiral" scene={{nome:'Casa'}} extraTools={organizedTools} documents={<p>Documentos disponíveis</p>} renderTool={tool=><p>Ferramenta {tool}</p>}/>);
 const nav=screen.getByRole('navigation',{name:'Áreas do escudo'});
 expect(within(nav).getAllByRole('button')).toHaveLength(6);
 for(const name of ['Sessão','Cena','Participantes','Arquivo','Áudio','Regras'])expect(within(nav).getByRole('button',{name,exact:true})).toBeInTheDocument();
 expect(screen.getByRole('region',{name:'Resumo dos participantes'})).toBeVisible();
 expect(screen.queryByRole('region',{name:'Inimigos e NPCs'})).not.toBeInTheDocument();
 expect(screen.queryByRole('complementary',{name:'Referências rápidas'})).not.toBeInTheDocument();
 fireEvent.click(within(nav).getByRole('button',{name:'Participantes'}));
 expect(screen.getByRole('region',{name:'Inimigos e NPCs'})).toBeVisible();
 const subnav=screen.getByRole('navigation',{name:'Ferramentas de Participantes'});
 expect(within(subnav).getByRole('button',{name:'Tokens'})).toBeInTheDocument();
 expect(within(subnav).getByRole('button',{name:'Jogadores'})).toBeInTheDocument();
 fireEvent.click(within(nav).getByRole('button',{name:'Regras'}));
 expect(screen.getByRole('complementary',{name:'Referências rápidas'})).toBeVisible();
 expect(screen.getByText('Maior dado − dificuldade')).toBeVisible();
});
test('organized navigation remembers the last tool and preserves its draft',()=>{
 render(<MasterShield organized campaignSystem="espiral" extraTools={organizedTools} renderTool={tool=><input aria-label={'Rascunho '+tool}/>}/>);
 const nav=screen.getByRole('navigation',{name:'Áreas do escudo'});
 fireEvent.click(within(nav).getByRole('button',{name:'Cena',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Clima',exact:true}));
 fireEvent.change(screen.getByRole('textbox',{name:'Rascunho weather'}),{target:{value:'Névoa ao anoitecer'}});
 fireEvent.click(within(nav).getByRole('button',{name:'Áudio'}));
 fireEvent.click(screen.getByRole('button',{name:'Soundpad',exact:true}));
 fireEvent.click(within(nav).getByRole('button',{name:'Cena',exact:true}));
 expect(screen.getByRole('textbox',{name:'Rascunho weather'})).toHaveValue('Névoa ao anoitecer');
 fireEvent.click(within(nav).getByRole('button',{name:'Áudio'}));
 expect(screen.getByRole('textbox',{name:'Rascunho soundpad'})).toBeVisible();
});
test('organized archive unifies documents, campaign notes and private reminders',()=>{
 render(<MasterShield organized campaignSystem="espiral" documents={<input aria-label="Documento"/>} renderTool={tool=><p>Ferramenta {tool}</p>}/>);
 fireEvent.click(screen.getByRole('button',{name:'Arquivo',exact:true}));
 expect(screen.getByRole('textbox',{name:'Documento'})).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Lembretes privados',exact:true}));
 expect(screen.getByRole('textbox',{name:'Anotações do mestre'})).toBeVisible();
 expect(screen.getByRole('button',{name:'Anotações',exact:true})).toBeInTheDocument();
});

test.each([false,true])('shield body omits duplicate initiative and session controls (organized: %s)',organized=>{
 const tool=jest.fn(id=><p>Ferramenta {id}</p>);
 render(<MasterShield organized={organized} combat scene={{nome:'Casa'}} renderTool={tool}/>);
 expect(screen.queryByRole('region',{name:'Iniciativa da sessão'})).not.toBeInTheDocument();
 expect(tool).not.toHaveBeenCalledWith('sessionModes');
 expect(tool).not.toHaveBeenCalledWith('initiative');
 expect(screen.queryByText('Ferramenta sessionModes')).not.toBeInTheDocument();
 expect(screen.getAllByText('Combate ativo').length).toBeGreaterThan(0);
});

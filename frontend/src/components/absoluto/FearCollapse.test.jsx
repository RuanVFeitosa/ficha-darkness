import React,{useState} from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import FearCollapse from './FearCollapse';
import AbsolutoMedo from './AbsolutoMedo';
import {criarBaseV1} from '../../data/absolutoV1';
import {defesaPersonagem,alterarMedo,descansar} from '../../data/absolutoV1';
import {protegerDoMedo,enfrentarMedo} from '../../utils/absolutoMedo';

test('bônus dura até Medo II e não reaparece ao subir novamente',()=>{
 const protegido=protegerDoMedo({...criarBaseV1(),medo:6});
 const tres=alterarMedo(protegido,-2);
 expect(tres.bonusEsquivaMedo).toBe(3);
 expect(defesaPersonagem(tres,true,true)).toBe(6);
 const dois=alterarMedo(tres,-1);
 expect(dois.bonusEsquivaMedo).toBe(0);
 expect(defesaPersonagem(dois,true,true)).toBe(3);
 expect(alterarMedo(dois,3).bonusEsquivaMedo).toBe(0);
 expect(dois.protecaoMedoUsada).toBe(true);
 expect(descansar(protegido).bonusEsquivaMedo).toBe(0);
 expect(enfrentarMedo({...protegido,medo:6}).bonusEsquivaMedo).toBe(0);
});

test('proteger reduz Medo a V, aumenta somente Esquiva em três e não pode ser repetido',()=>{
 const p={...criarBaseV1(),medo:6};
 const next=protegerDoMedo(p);
 expect(next.medo).toBe(5);
 expect(next.esperanca).toEqual(p.esperanca);
 expect(defesaPersonagem(next,true,true)).toBe(6);
 expect(defesaPersonagem(next,true,false)).toBe(6);
 expect(defesaPersonagem(next)).toBe(defesaPersonagem(p));
 const voltou=alterarMedo(JSON.parse(JSON.stringify(next)),1);
 expect(protegerDoMedo(voltou)).toBe(voltou);
 const choose=jest.fn();
 render(<FearCollapse hope={7} protectionUsed={voltou.protecaoMedoUsada} onChoose={choose} onClose={()=>{}}/>);
 const button=screen.getByRole('button',{name:/Proteger-se/});
 expect(button).toBeDisabled();fireEvent.click(button);expect(choose).not.toHaveBeenCalled();
});

test('clicar em proteger fecha a tela e bloqueia a escolha quando volta a VI',()=>{
 function Ficha(){const [p,setP]=useState({...criarBaseV1(),medo:6});return <AbsolutoMedo personagem={p} setPersonagem={setP} onAcaoMedo={()=>{}}/>;}
 render(<Ficha/>);
 fireEvent.click(screen.getByRole('button',{name:/Proteger-se/}));
 expect(screen.getByLabelText('Medo atual')).toHaveValue(5);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Aumentar Medo'}));
 expect(screen.getByRole('button',{name:/Proteger-se/})).toBeDisabled();
});

test('quatro escolhas flutuantes, foco contido e enfrentamento bloqueado sem Esperança',()=>{
 const choose=jest.fn(),close=jest.fn();
 render(<FearCollapse hope={4} onChoose={choose} onClose={close}/>);
 const dialog=screen.getByRole('dialog');
 expect(within(dialog).getByRole('button',{name:/Enfrentar o Medo/})).toBeDisabled();
 fireEvent.click(within(dialog).getByRole('button',{name:/Buscar abrigo/}));
 expect(choose).toHaveBeenCalledWith('abrigo');
 fireEvent.keyDown(dialog,{key:'Escape'});expect(close).toHaveBeenCalledTimes(1);
});
test('atingir VI abre a tela automaticamente; enfrentar cobra imediatamente e reduz para II',()=>{
 const choose=jest.fn();
 function Ficha(){const [p,setP]=useState({...criarBaseV1(),medo:5});return <AbsolutoMedo personagem={p} setPersonagem={setP} onAcaoMedo={choose}/>;}
 const {container}=render(<Ficha/>);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Aumentar Medo'}));
 const dialog=screen.getByRole('dialog');expect(container.contains(dialog)).toBe(false);
 expect(document.body.style.overflow).toBe('hidden');
 fireEvent.click(within(dialog).getByRole('button',{name:/Enfrentar o Medo/}));
 expect(choose).toHaveBeenCalledWith('enfrentar');
 expect(screen.getByLabelText('Medo atual')).toHaveValue(2);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(document.body.style.overflow).not.toBe('hidden');
});

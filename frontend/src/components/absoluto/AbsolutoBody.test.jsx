import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import AbsolutoBody,{bodyRegionState} from './AbsolutoBody';
import {integridadeInicial} from '../../data/absolutoV1';
test.each([[100,'stable'],[51,'stable'],[50,'injured'],[11,'injured'],[10,'critical'],[1,'critical'],[0,'nonfunctional']])('Integridade %s/100 representa %s', (atual,key)=>{
 expect(bodyRegionState({atual,max:100}).key).toBe(key);
});
test('as oito regiões mostram suas reservas e selecionam os controles corretos',()=>{
 const members=integridadeInicial(2);members.pernaDireita.atual=0;
 const onChange=jest.fn(),onDamage=jest.fn(),onDefenseChange=jest.fn(),onMaxChange=jest.fn(),onInspectDefense=jest.fn();
 const armor={nome:'Capacete'};
 const {container}=render(<AbsolutoBody members={members} onChange={onChange} onDamage={onDamage} onDefenseChange={onDefenseChange} onMaxChange={onMaxChange} defensesFor={key=>key==='cabeca'?[armor]:[]} onInspectDefense={onInspectDefense}/>);
 expect(container.querySelectorAll('.abs-body-region')).toHaveLength(8);
 expect(screen.getByRole('button',{name:'Perna direita: 0 de 32, Não Funcional'})).toHaveClass('is-nonfunctional');
 const head=screen.getByRole('button',{name:'Cabeça: 24 de 24, Estável'});
 fireEvent.keyDown(head,{key:'Enter'});
 expect(head).toHaveAttribute('aria-pressed','true');
 expect(screen.getByLabelText('Integridade atual de Cabeça')).toHaveValue(24);
 fireEvent.click(screen.getByRole('button',{name:'Ajustar -5 de Integridade'}));expect(onDamage).toHaveBeenLastCalledWith('cabeca',5);
 fireEvent.change(screen.getByLabelText('Dano recebido na região'),{target:{value:'12'}});
 fireEvent.click(screen.getByRole('button',{name:'Aplicar dano'}));expect(onDamage).toHaveBeenLastCalledWith('cabeca',12);
 fireEvent.change(screen.getByLabelText('Defesas Adicionais de Cabeça'),{target:{value:'3'}});expect(onDefenseChange).toHaveBeenCalledWith('cabeca','3');
 fireEvent.change(screen.getByLabelText('Integridade máxima de Cabeça'),{target:{value:'30'}});expect(onMaxChange).toHaveBeenCalledWith('cabeca','30');
 fireEvent.click(screen.getByRole('button',{name:'Capacete ↗'}));expect(onInspectDefense).toHaveBeenCalledWith(armor,-1);
});

test('separa equipamento somente leitura, adicionais editáveis e soma total',()=>{
 const members=integridadeInicial(2);members.torso={...members.torso,defesa:3,defesaAdicional:2};
 const {rerender}=render(<AbsolutoBody members={members} defensesFor={()=>[{nome:'Colete',defesaBonus:3}]} />);
 expect(screen.getByLabelText('Defesa por Equipamento de Tórax')).toHaveValue(3);
 expect(screen.getByLabelText('Defesa por Equipamento de Tórax')).toHaveAttribute('readonly');
 expect(screen.getByLabelText('Defesas Adicionais de Tórax')).toHaveValue(2);
 expect(screen.getByLabelText('Defesa Total de Tórax')).toHaveValue(5);
 expect(screen.getByLabelText('Defesa Total de Tórax')).toHaveAttribute('readonly');
 rerender(<AbsolutoBody members={members} defensesFor={()=>[]} />);
 expect(screen.getByLabelText('Defesa Total de Tórax')).toHaveValue(2);
});

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
 fireEvent.click(screen.getByRole('button',{name:'Ajustar -5 de Integridade'}));expect(onChange).toHaveBeenLastCalledWith('cabeca',19);
 fireEvent.change(screen.getByLabelText('Dano recebido na região'),{target:{value:'12'}});
 fireEvent.click(screen.getByRole('button',{name:'Aplicar dano'}));expect(onDamage).toHaveBeenLastCalledWith('cabeca',12);
 fireEvent.change(screen.getByLabelText('Defesa de Cabeça'),{target:{value:'3'}});expect(onDefenseChange).toHaveBeenCalledWith('cabeca','3');
 fireEvent.change(screen.getByLabelText('Integridade máxima de Cabeça'),{target:{value:'30'}});expect(onMaxChange).toHaveBeenCalledWith('cabeca','30');
 fireEvent.click(screen.getByRole('button',{name:'Capacete ↗'}));expect(onInspectDefense).toHaveBeenCalledWith(armor,-1);
});

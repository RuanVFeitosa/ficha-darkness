import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import PlayerUVControls from './PlayerUVControls';
test('mestre bloqueia, libera, liga e apaga a UV de cada jogador',()=>{
 const onChange=jest.fn();const player={id:'espiral:a',name:'Victoria',state:{lanterna:{modo:'uv',ativa:true,alcance:25}}};
 const {rerender}=render(<PlayerUVControls players={[player]} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'Apagar UV de Victoria'}));
 expect(onChange).toHaveBeenLastCalledWith(player.id,{lanterna:{modo:'uv',ativa:false,alcance:25}});
 fireEvent.click(screen.getByLabelText('Permitir UV para Victoria'));
 expect(onChange).toHaveBeenLastCalledWith(player.id,{uvPermitida:false,lanterna:{modo:'normal',ativa:true,alcance:25}});
 rerender(<PlayerUVControls players={[{...player,state:{...player.state,uvPermitida:false}}]} onChange={onChange}/>);
 expect(screen.getByRole('button',{name:'Ligar UV de Victoria'})).toBeDisabled();
 fireEvent.click(screen.getByLabelText('Permitir UV para Victoria'));
 expect(onChange).toHaveBeenLastCalledWith(player.id,{uvPermitida:true});
 rerender(<PlayerUVControls players={[{...player,state:{lanterna:{ativa:false,modo:'normal'}}}]} onChange={onChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ligar UV de Victoria'}));
 expect(onChange).toHaveBeenLastCalledWith(player.id,{lanterna:{ativa:true,modo:'uv'}});
});

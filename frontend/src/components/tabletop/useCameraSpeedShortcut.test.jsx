import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import useCameraSpeedShortcut from './useCameraSpeedShortcut';

function Demo(){
 const [speed,setSpeed]=useState(1);
 useCameraSpeedShortcut(setSpeed);
 return <div className="tt3"><canvas data-testid="map"/><input aria-label="Campo"/><output>{speed}</output></div>;
}
test('Ctrl + roda ajusta velocidade e intercepta o zoom somente no mapa',()=>{
 render(<Demo/>);
 const map=screen.getByTestId('map');
 const wheel=new WheelEvent('wheel',{bubbles:true,cancelable:true,ctrlKey:true,deltaY:-100});
 fireEvent(map,wheel);
 expect(wheel.defaultPrevented).toBe(true);
 expect(screen.getByRole('status')).toHaveTextContent('1.25');
 fireEvent.wheel(map,{deltaY:-100});
 fireEvent.wheel(screen.getByLabelText('Campo'),{ctrlKey:true,deltaY:-100});
 expect(screen.getByRole('status')).toHaveTextContent('1.25');
 fireEvent.wheel(map,{ctrlKey:true,deltaY:100});
 expect(screen.getByRole('status')).toHaveTextContent('1');
});

test('Shift + roda inclina em graus sem zoom e respeita limites e campos do painel',()=>{
 const setSpeed=jest.fn();let motion={roll:44,pitch:5,intensity:1,speed:1};
 const setMotion=jest.fn(update=>{motion=update(motion);});
 function TiltDemo(){useCameraSpeedShortcut(setSpeed,setMotion);return <div className="tt3"><canvas data-testid="tilt-map"/><input aria-label="Ângulo"/></div>;}
 render(<TiltDemo/>);
 const map=screen.getByTestId('tilt-map');
 const wheel=new WheelEvent('wheel',{bubbles:true,cancelable:true,shiftKey:true,deltaY:-100});
 fireEvent(map,wheel);
 expect(wheel.defaultPrevented).toBe(true);
 expect(motion).toEqual({roll:45,pitch:5,intensity:1,speed:1});
 fireEvent.wheel(map,{shiftKey:true,deltaY:-100});
 expect(motion.roll).toBe(45);
 fireEvent.wheel(map,{shiftKey:true,deltaX:100});
 expect(motion.roll).toBe(44);
 fireEvent.wheel(screen.getByLabelText('Ângulo'),{shiftKey:true,deltaY:-100});
 expect(motion.roll).toBe(44);
 expect(setSpeed).not.toHaveBeenCalled();
 fireEvent.wheel(map,{ctrlKey:true,shiftKey:true,deltaY:-100});
 expect(setSpeed).toHaveBeenCalledTimes(1);
 expect(motion.roll).toBe(44);
});

test('jogador não pode alterar velocidade ou inclinação pelos atalhos',()=>{
 const setSpeed=jest.fn(),setMotion=jest.fn();
 function PlayerDemo({enabled}){useCameraSpeedShortcut(setSpeed,setMotion,enabled);return <div className="tt3"><canvas data-testid="player-map"/></div>;}
 const {rerender}=render(<PlayerDemo enabled/>);
 rerender(<PlayerDemo enabled={false}/>);
 const map=screen.getByTestId('player-map');
 fireEvent.wheel(map,{ctrlKey:true,deltaY:-100});
 fireEvent.wheel(map,{shiftKey:true,deltaY:100});
 expect(setSpeed).not.toHaveBeenCalled();
 expect(setMotion).not.toHaveBeenCalled();
});

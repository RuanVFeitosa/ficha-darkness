import React from 'react';
import {render,screen,fireEvent,act} from '@testing-library/react';
import SiteBoot,{BOOT_DURATION} from './SiteBoot';
beforeEach(()=>jest.useFakeTimers());afterEach(()=>{jest.useRealTimers();delete window.matchMedia;});
test('mostra progresso e encerra automaticamente a inicialização',()=>{
 const done=jest.fn();render(<SiteBoot onFinish={done}/>);
 expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','9');
 act(()=>jest.advanceTimersByTime(1500));expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow','9');
 expect(done).not.toHaveBeenCalled();act(()=>jest.advanceTimersByTime(BOOT_DURATION));expect(done).toHaveBeenCalledTimes(1);
});
test('permite pular a inicialização',()=>{const done=jest.fn();render(<SiteBoot onFinish={done}/>);fireEvent.click(screen.getByRole('button',{name:/Pular inicialização/}));act(()=>jest.advanceTimersByTime(650));expect(done).toHaveBeenCalledTimes(1);});
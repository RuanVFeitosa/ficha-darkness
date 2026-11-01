import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import HopeWhispers from './HopeWhispers';
import HopeWhispersEditor from './HopeWhispersEditor';

test('custom messages appear only at zero hope, with defaults when cleared',()=>{
 const {rerender}=render(<HopeWhispers resource={{atual:0}} messages={['A porta continua fechada.']}/>);
 expect(screen.getByText('A porta continua fechada.')).toBeTruthy();
 rerender(<HopeWhispers resource={{atual:1}} messages={['A porta continua fechada.']}/>);
 expect(screen.queryByText('A porta continua fechada.')).toBeNull();
 rerender(<HopeWhispers resource={{atual:0}} messages={[]}/>);
 expect(screen.getByText('O silêncio não traz respostas.')).toBeTruthy();
});
test('master editor saves trimmed individual messages and keeps the draft after failure',async()=>{
 const onSave=jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
 render(<HopeWhispersEditor onSave={onSave}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'  Primeira frase.\n\nSegunda frase.  '}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar mensagens'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('Não foi possível'));
 expect(screen.getByRole('textbox').value).toContain('Segunda frase.');
 fireEvent.click(screen.getByRole('button',{name:'Salvar mensagens'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('Mensagens salvas'));
 expect(onSave).toHaveBeenLastCalledWith(['Primeira frase.','Segunda frase.']);
});

test('master editor blocks messages above the limits instead of truncating them',()=>{
 const onSave=jest.fn();
 render(<HopeWhispersEditor onSave={onSave}/>);
 const input=screen.getByRole('textbox');
 const save=screen.getByRole('button',{name:'Salvar mensagens'});
 fireEvent.change(input,{target:{value:'a'.repeat(121)}});
 expect(save.disabled).toBe(true);
 expect(screen.getByRole('alert')).toBeTruthy();
 fireEvent.change(input,{target:{value:Array(8).fill('Mensagem').join('\n')}});
 expect(save.disabled).toBe(true);
 fireEvent.click(save);
 expect(onSave).not.toHaveBeenCalled();
 fireEvent.change(input,{target:{value:'Mensagem válida'}});
 expect(save.disabled).toBe(false);
});

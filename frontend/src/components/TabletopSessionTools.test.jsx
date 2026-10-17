import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import TabletopSessionTools from './TabletopSessionTools';
let mockMounts=0;
jest.mock('../pages/mesa',()=>({__esModule:true,default:function MockMesa(props){require("react").useEffect(()=>{mockMounts+=1;},[]);return <div data-testid="mesa">{props.requestedTool}:{props.requestVersion}<input aria-label="Volume" defaultValue="50"/></div>;}}));
beforeEach(()=>{mockMounts=0;});
test('mantém a sessão montada e os controles de áudio ao fechar o painel',async()=>{
 const props={open:true,tool:'audio',requestVersion:1,onClose:jest.fn()};
 const {rerender}=render(<TabletopSessionTools {...props}/>);
 await screen.findByTestId('mesa');
 fireEvent.change(screen.getByLabelText('Volume'),{target:{value:'25'}});
 rerender(<TabletopSessionTools {...props} open={false}/>);
 expect(screen.getByLabelText('Ferramentas da sessão')).toHaveAttribute('aria-hidden','true');
 expect(screen.getByLabelText('Ferramentas da sessão')).toHaveAttribute('inert');
 rerender(<TabletopSessionTools {...props} tool="evidence" requestVersion={2}/>);
 expect(screen.getByTestId('mesa')).toHaveTextContent('evidence:2');
 expect(screen.getByLabelText('Volume')).toHaveValue('25');
 expect(mockMounts).toBe(1);
});
test('permite voltar ao mapa pelo botão e por Escape',async()=>{
 const onClose=jest.fn();render(<TabletopSessionTools open tool="audio" requestVersion={1} onClose={onClose}/>);
 await screen.findByTestId('mesa');
 fireEvent.click(screen.getByRole('button',{name:/Fechar painel/}));
 fireEvent.keyDown(screen.getByRole('complementary'),{key:'Escape'});
 expect(onClose).toHaveBeenCalledTimes(2);
});
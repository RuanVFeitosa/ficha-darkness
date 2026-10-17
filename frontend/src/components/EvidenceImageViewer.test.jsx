import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import EvidenceImageViewer from './EvidenceImageViewer';
test('amplia por botão e roda e permite voltar ao enquadramento inicial',()=>{
 render(<EvidenceImageViewer src="evidence.png" alt="Carta"/>);
 fireEvent.click(screen.getByRole('button',{name:'Aumentar zoom'}));
 expect(screen.getByLabelText('Zoom da evidência')).toHaveTextContent('125%');
 fireEvent.wheel(screen.getByLabelText(/Use a roda/),{deltaY:-100});
 expect(screen.getByLabelText('Zoom da evidência')).toHaveTextContent('138%');
 fireEvent.click(screen.getByRole('button',{name:'Ajustar'}));
 expect(screen.getByLabelText('Zoom da evidência')).toHaveTextContent('100%');
 expect(screen.getByRole('img')).toHaveStyle({transform:'translate(0px, 0px) scale(1)'});
});
test('abre sobre a tela e fecha com Escape sem fechar a evidência',()=>{
 render(<EvidenceImageViewer src="evidence.png" alt="Carta"/>);
 fireEvent.click(screen.getByRole('button',{name:'Tela cheia'}));
 expect(screen.getByRole('dialog',{name:'Evidência: Carta'})).toHaveAttribute('aria-modal','true');
 fireEvent.keyDown(screen.getByRole('button',{name:'Sair da tela cheia'}),{key:'Escape'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.getByRole('img',{name:'Carta'})).toBeInTheDocument();
});
test('move a imagem ampliada por arraste',()=>{
 const previous=window.PointerEvent;
 window.PointerEvent=MouseEvent;
 render(<EvidenceImageViewer src="evidence.png" alt="Carta"/>);
 fireEvent.click(screen.getByRole('button',{name:'Aumentar zoom'}));
 const viewport=screen.getByLabelText(/Use a roda/);
 viewport.setPointerCapture=jest.fn();
 fireEvent.pointerDown(viewport,{button:0,clientX:100,clientY:100});
 fireEvent.pointerMove(viewport,{clientX:140,clientY:120});
 fireEvent.pointerUp(viewport);
 expect(screen.getByRole('img')).toHaveStyle({transform:'translate(40px, 20px) scale(1.25)'});
 window.PointerEvent=previous;
});
jest.mock('react-markdown',()=>({__esModule:true,default:({children})=><div>{children}</div>}));
jest.mock('remark-gfm',()=>({__esModule:true,default:()=>{}}));
import React from 'react';
import {render,screen,fireEvent,within,waitFor} from '@testing-library/react';
import Layout from './AbilityReadingLayout';
import Card from './CardHabilidadeRecolhivel';
beforeEach(()=>{window.scrollTo=jest.fn();});
function Sheet(){return <Layout><button type="button">Controle da ficha</button><Card classeExtra="criada aprovada" habilidade={{id:'a',nome:'Vínculo',paginas:[{titulo:'Efeito',conteudo:'Efeito completo'},{titulo:'Limites',conteudo:'Condições completas'}]}}/></Layout>;}
test('amplia habilidade ao lado da ficha, mantém controles e paginação',()=>{const {container}=render(<Sheet/>);fireEvent.click(screen.getByRole('button',{name:'Ampliar habilidade Vínculo'}));const pane=screen.getByRole('region',{name:'Leitura da habilidade Vínculo'});expect(container.querySelector('.ability-reading-layout')).toHaveClass('is-reading');expect(screen.getByRole('button',{name:'Controle da ficha'})).toBeEnabled();expect(within(pane).getByText('Efeito completo')).toBeInTheDocument();fireEvent.click(within(pane).getByRole('button',{name:'→'}));expect(within(pane).getByText('Condições completas')).toBeInTheDocument();fireEvent.click(within(pane).getByRole('button',{name:'Fechar leitura da habilidade'}));expect(screen.queryByRole('region',{name:'Leitura da habilidade Vínculo'})).toBeNull();expect(document.body.style.overflow).toBe('');});
test('Escape fecha leitura e devolve foco ao botão de origem',async()=>{render(<Sheet/>);const button=screen.getByRole('button',{name:'Ampliar habilidade Vínculo'});button.focus();fireEvent.click(button);fireEvent.keyDown(document,{key:'Escape'});await waitFor(()=>expect(button).toHaveFocus());});

test('habilidades comuns não oferecem ampliar',()=>{render(<Layout><Card habilidade={{nome:'Habilidade de classe',descricao:'Efeito'}} classeExtra='arquetipo'/></Layout>);expect(screen.queryByRole('button',{name:'Ampliar habilidade Habilidade de classe'})).toBeNull();});

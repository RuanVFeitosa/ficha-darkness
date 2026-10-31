import React from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import MasterShield from './MasterShield';
beforeEach(()=>localStorage.clear());
test('consulta os dois sistemas, busca sem acentos e mantém favoritos',()=>{
 const {unmount}=render(<MasterShield campaignId="mesa-a"/>);
 expect(screen.getByText('Modificadores e limite de dados')).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Buscar no escudo do mestre'),{target:{value:'sanidade'}});
 expect(screen.getByText('Sanidade e colapso')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Favoritar Sanidade e colapso'}));
 fireEvent.click(screen.getByRole('button',{name:'Mostrar somente favoritos'}));
 expect(screen.getByText('1 referências')).toBeInTheDocument();
 unmount();render(<MasterShield campaignId="mesa-a"/>);
 expect(screen.getByRole('button',{name:'Favoritar Sanidade e colapso'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'ESPIRAL'}));
 fireEvent.change(screen.getByLabelText('Buscar no escudo do mestre'),{target:{value:'pressao'}});
 expect(screen.getByText('Pressão, Abalo, Crise e Ruptura')).toBeInTheDocument();
});
test('calcula lesão e testa as margens de ESPIRAL usando as regras da ficha',()=>{
 render(<MasterShield/>);fireEvent.click(screen.getByRole('button',{name:'ESPIRAL'}));
 fireEvent.click(screen.getByText('Resolver um teste'));
 fireEvent.change(screen.getByLabelText('Resultados dos dados'),{target:{value:'6, 4'}});
 fireEvent.change(screen.getByLabelText('Dificuldade da consulta'),{target:{value:'4'}});
 expect(screen.getByLabelText('Resolução da consulta')).toHaveTextContent('Sucesso · margem +2');
 fireEvent.click(screen.getByText('Calcular dano e proteção'));
 fireEvent.change(screen.getByLabelText('Dano bruto'),{target:{value:'10'}});
 fireEvent.change(screen.getByLabelText('Proteção / RD'),{target:{value:'3'}});
 expect(screen.getByLabelText('Dano líquido')).toHaveTextContent('7 de Impacto · Grave');
});
test('anotações e progresso são privados e separados por campanha',()=>{
 const view=render(<MasterShield campaignId="a"/>);
 fireEvent.click(screen.getByText('Relógio de progresso e notas privadas'));
 fireEvent.change(screen.getByLabelText('Anotações do mestre'),{target:{value:'A pista está na biblioteca.'}});
 fireEvent.click(screen.getByRole('button',{name:'Avançar progresso'}));
 expect(screen.getByLabelText('Progresso do relógio')).toHaveTextContent('1 / 6');
 view.unmount();render(<MasterShield campaignId="b"/>);
 expect(screen.getByLabelText('Anotações do mestre')).toHaveValue('');
 expect(JSON.parse(localStorage.getItem('darkness:master-shield:a:notes'))).toBe('A pista está na biblioteca.');
});
test('Absoluto resolve Êxitos e Crítico sem usar a regra de margem do ESPIRAL',()=>{
 render(<MasterShield/>);
 fireEvent.click(screen.getByText('Resolver um teste'));
 fireEvent.change(screen.getByLabelText('Dificuldade da consulta'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Resultados dos dados'),{target:{value:'6, 6'}});
 expect(screen.getByLabelText('Resolução da consulta')).toHaveTextContent('Crítico · 2 Êxitos · 2 Finais');
});

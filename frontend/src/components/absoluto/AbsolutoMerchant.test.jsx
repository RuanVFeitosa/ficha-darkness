import React from 'react';
import {render,screen,fireEvent,within} from '@testing-library/react';
import AbsolutoMerchant from './AbsolutoMerchant';
const items=[{id:'p',nome:'Pistola',categoria:'armas-fogo',detalhe:'Leve',preco:180,armaStatus:{tipo:'Pistola',dmg:'2d10+3'}},{id:'m',nome:'Martelo',categoria:'armas-corpo',detalhe:'Pesado',preco:120,armaStatus:{tipo:'Corpo a Corpo',dmg:'2d10+1'}}];
const props={items,renderIcon:()=>null,formatPrice:item=>`${item.preco} cr`,conflict:()=>null};
test('selecting an item updates the inspection and adds the same catalog item to checkout',()=>{
 const onAdd=jest.fn();render(<AbsolutoMerchant {...props} onAdd={onAdd}/>);
 fireEvent.click(screen.getByRole('button',{name:/Martelo/}));
 expect(within(screen.getByRole('region',{name:'Item selecionado'})).getByRole('heading',{name:'Martelo'})).toBeTruthy();
 expect(screen.queryByRole('region',{name:'Catálogo'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Separar/}));expect(onAdd).toHaveBeenCalledWith(items[1]);
 fireEvent.click(screen.getByRole('button',{name:/Voltar aos itens/}));
 expect(screen.getByRole('region',{name:'Catálogo'})).toBeTruthy();
 expect(screen.queryByRole('region',{name:'Item selecionado'})).toBeNull();
});
test('a filtered-out selection returns to cards and defense conflicts disable purchase',()=>{
 const {rerender}=render(<AbsolutoMerchant {...props} onAdd={jest.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:/Martelo/}));
 rerender(<AbsolutoMerchant {...props} items={[items[0]]} conflict={()=>({nome:'Colete'})} onAdd={jest.fn()}/>);
 expect(screen.getByRole('region',{name:'Catálogo'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Pistola/}));
 expect(screen.getByRole('heading',{name:'Pistola'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Já protegido'}).disabled).toBe(true);
});

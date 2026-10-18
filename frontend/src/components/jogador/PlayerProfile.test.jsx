import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import PlayerProfile from './PlayerProfile';
test('primeiro acesso oferece identidade própria e não assume o pronome legado',async()=>{
 const onSave=jest.fn().mockResolvedValue(true);
 render(<PlayerProfile perfil={{nome:'Ana',pronome:'Ele',personagens:[{id:'1'}]}} onSave={onSave}/>);
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 expect(screen.getByLabelText('Pronome do jogador')).toHaveValue('');
 fireEvent.change(screen.getByLabelText('Nome do jogador'),{target:{value:'Bia'}});
 fireEvent.change(screen.getByLabelText('Pronome do jogador'),{target:{value:'Ela'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar perfil'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(onSave).toHaveBeenCalledWith(expect.objectContaining({nome:'Bia',pronome:'Ela',perfilConfigurado:true,personagens:[{id:'1'}]}));
});
test('perfil com foto aparece no cabeçalho e pode ser editado',()=>{
 render(<PlayerProfile perfil={{nome:'Ana',fotoPerfil:'data:image/png;base64,AA==',pronome:'Ela',perfilConfigurado:true}} onSave={jest.fn()}/>);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.getByRole('img',{name:'Foto do jogador'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Editar perfil de Ana'}));
 expect(screen.getByLabelText('Pronome do jogador')).toHaveValue('Ela');
 fireEvent.click(screen.getByRole('button',{name:'Agora não'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
test('janela de edição sai da camada do cabeçalho para receber os cliques',()=>{
 render(<main className="pj pj-dashboard"><header><PlayerProfile perfil={{nome:'Ana'}} onSave={jest.fn()}/></header><section>Personagens</section></main>);
 const dialog=screen.getByRole('dialog');
 expect(dialog.parentElement.parentElement).toHaveClass('pj-dashboard');
 expect(dialog.closest('header')).toBeNull();
 fireEvent.change(screen.getByLabelText('Nome do jogador'),{target:{value:'Bia'}});
 expect(screen.getByLabelText('Nome do jogador')).toHaveValue('Bia');
});
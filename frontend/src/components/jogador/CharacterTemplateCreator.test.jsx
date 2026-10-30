import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CharacterTemplateCreator from './CharacterTemplateCreator';
import { salvarFichaTemplate } from '../../services/characterTemplates';
jest.mock('../../services/characterTemplates',()=>({salvarFichaTemplate:jest.fn()}));
const perfil={nome:'Ana',personagens:[],templatesPersonagem:[]};
beforeEach(()=>jest.clearAllMocks());
test('gera e revisa; falha de vínculo permite tentar novamente sem duplicar a ficha',async()=>{
 const onCreated=jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),onClose=jest.fn();
 salvarFichaTemplate.mockResolvedValue({id:'87654321',sistema:'espiral'});
 render(<CharacterTemplateCreator perfil={perfil} fichas={[]} onCreated={onCreated} onClose={onClose}/>);
 fireEvent.change(screen.getByLabelText('Sistema do template'),{target:{value:'espiral'}});
 fireEvent.click(screen.getByRole('button',{name:'Gerar personagem'}));
 expect((await screen.findByLabelText('Nome do personagem template')).value).toBeTruthy();
 fireEvent.click(screen.getByText('Criar e adicionar aos meus personagens'));
 expect(await screen.findByRole('alert')).toHaveTextContent('vínculo falhou');
 fireEvent.click(screen.getByText('Vincular ficha criada'));
 await waitFor(()=>expect(onClose).toHaveBeenCalled());
 expect(salvarFichaTemplate).toHaveBeenCalledTimes(1);
});
test('guarda uma ficha existente como modelo com os dados completos',async()=>{
 const onSaveModelos=jest.fn().mockResolvedValue(true);
 const dados={nome:'Lia',atributos:{forca:25},inventario:[{nome:'Kit'}]};
 render(<CharacterTemplateCreator perfil={perfil} fichas={[{id:'1234',sistema:'darkness',nome:'Lia',dados}]} onSaveModelos={onSaveModelos}/>);
 fireEvent.change(screen.getByLabelText('Ficha de origem'),{target:{value:'darkness:1234'}});
 fireEvent.change(screen.getByLabelText('Nome do modelo'),{target:{value:'Minha combatente'}});
 fireEvent.click(screen.getByText('Salvar personagem como modelo'));
 await waitFor(()=>expect(onSaveModelos).toHaveBeenCalledWith([expect.objectContaining({nome:'Minha combatente',sistema:'darkness',dados})]));
});

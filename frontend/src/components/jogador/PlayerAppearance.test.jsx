import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import PlayerAppearance from './PlayerAppearance';
import { PALETA_CLARA, salvarPaletaFicha } from '../../utils/playerAppearance';
jest.mock('../../utils/playerAppearance', () => ({ ...jest.requireActual('../../utils/playerAppearance'), salvarPaletaFicha: jest.fn() }));
const paleta = { id: 'eclipse', nome: 'Eclipse', cores: {...PALETA_CLARA,halo:'#ff9900',simbolo:'#aabbcc'} };
const fichas = [{id:'1234',sistema:'darkness',nome:'Renegada',dados:{}},{id:'5678',sistema:'espiral',nome:'Investigadora',dados:{}}];
beforeEach(() => jest.clearAllMocks());
async function abrir(props = {}) {
 const callbacks = { onSavePagina: jest.fn().mockResolvedValue(true), onSavePaletas: jest.fn().mockResolvedValue(true), onFichaSalva: jest.fn() };
 render(<PlayerAppearance perfil={{nome:'Ana'}} fichas={fichas} {...callbacks} {...props}/>);
 fireEvent.click(screen.getByText('Paletas de cores'));
 await screen.findByLabelText('Nome da paleta');
 return callbacks;
}
test('cria uma paleta nomeada sem aplicar e permite reutilizar na página', async () => {
 const cb = await abrir();
 fireEvent.change(screen.getByLabelText('Nome da paleta'), {target:{value:'Minha paleta'}});
 fireEvent.change(screen.getByLabelText('Cor do halo'), {target:{value:'#ff0000'}});
 fireEvent.change(screen.getByLabelText('Cor do símbolo'), {target:{value:'#002ee6'}});
 fireEvent.click(screen.getByText('Salvar nova paleta'));
 await waitFor(()=>expect(cb.onSavePaletas).toHaveBeenCalledWith([expect.objectContaining({nome:'Minha paleta',cores:expect.objectContaining({halo:'#ff0000',simbolo:'#002ee6'})})]));
 expect(cb.onSavePagina).not.toHaveBeenCalled();
 fireEvent.click(await screen.findByText('Aplicar paleta'));
 await waitFor(()=>expect(cb.onSavePagina).toHaveBeenCalledWith(expect.objectContaining({halo:'#ff0000',simbolo:'#002ee6'})));
});
test('recupera a biblioteca, edita a mesma paleta e aplica a uma ficha',async()=>{
 const onSavePaletas = jest.fn().mockResolvedValue(true);
 salvarPaletaFicha.mockResolvedValue({temaFicha:paleta.cores});
 const cb = await abrir({perfil:{nome:'Ana',paletasPersonalizadas:[paleta]},onSavePaletas});
 fireEvent.change(screen.getByLabelText('Paletas salvas'),{target:{value:'eclipse'}});
 expect(screen.getByLabelText('Cor do símbolo')).toHaveValue('#aabbcc');
 fireEvent.change(screen.getByLabelText('Cor do símbolo'),{target:{value:'#ff0000'}});
 expect(screen.getByLabelText('Prévia do halo e símbolo')).toHaveStyle({'--pj-symbol-color':'#ff0000'});
 fireEvent.click(screen.getByText('Salvar alterações da paleta'));
 await waitFor(()=>expect(onSavePaletas).toHaveBeenCalledWith([{...paleta,cores:{...paleta.cores,simbolo:'#ff0000'}}]));
 fireEvent.change(screen.getByLabelText('Onde aplicar'),{target:{value:'darkness:1234'}});
 fireEvent.click(screen.getByText('Aplicar paleta'));
 await waitFor(()=>expect(salvarPaletaFicha).toHaveBeenCalledWith(fichas[0],{...paleta.cores,simbolo:'#ff0000'}));
 expect(cb.onFichaSalva).toHaveBeenCalled();
 expect(cb.onSavePagina).not.toHaveBeenCalled();
});
test('erro ao salvar mantém o rascunho e não oferece aplicação',async()=>{
 const onSavePaletas=jest.fn().mockResolvedValue(false);
 await abrir({onSavePaletas});
 fireEvent.change(screen.getByLabelText('Nome da paleta'),{target:{value:'Rascunho'}});
 fireEvent.click(screen.getByText('Salvar nova paleta'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
 expect(screen.getByLabelText('Nome da paleta')).toHaveValue('Rascunho');
 expect(screen.queryByText('Aplicar paleta')).not.toBeInTheDocument();
});

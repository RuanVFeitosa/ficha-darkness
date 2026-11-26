import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import CampanhaDashboard from './CampanhaDashboard';
import {listarCampanhas,buscarCampanhaPorCodigo,salvarCena,criarCampanhaMesa} from '../../services/mesaApi';
jest.mock('../../services/mesaApi',()=>({listarCampanhas:jest.fn(),buscarCampanhaPorCodigo:jest.fn(),salvarCena:jest.fn(),criarCampanhaMesa:jest.fn(),ouvirCampanha:()=>()=>{}}));
jest.mock('../../services/fichasCampanha',()=>({listarFichasParaCampanha:jest.fn(async()=>[]),listarFichasEspiralLocais:()=>[]}));
jest.mock('../tabletop/SceneAnimationEditor',()=>()=>null);
jest.mock('./AnotacoesCampanha',()=>()=>null);
jest.mock('./MuralInvestigacao',()=>()=>null);
jest.mock('./SceneCreationPreview',()=>()=>null);
const project={version:1,name:'A chegada',duration:12,layers:[]};
const campaign={id:'campaign',codigo:'TEST12',nome:'Campanha Cutscene',tabletop_tipo:'2d',membros:[],cenas:[{id:'source',nome:'A chegada',cenaEspecial:{ativo:true,tipoMidia:'cutscene',cutscene:project},imagensCena:[],mapasBatalha:[]}]};

test('a campanha exibe os recursos das fichas de Ordem vinculadas e identifica fichas indisponíveis', async () => {
 window.history.replaceState({}, '', '/?mestre=1');
 const ordem = { ...campaign, sistema: 'ordem', membros: [
   { ficha_id: 'ordem:lia', nome: 'Lia' },
   { ficha_id: 'ordem:ausente', nome: 'Agente ausente' },
 ] };
 listarCampanhas.mockResolvedValue([ordem]);
 buscarCampanhaPorCodigo.mockResolvedValue({ ...ordem, membros: [] });
 localStorage.setItem('ordem:fichas:v1', JSON.stringify([
   { id: 'lia', nome: 'Lia', nex: 15, attributes: { AGI: 2 }, resources: { pv: { current: 14, max: 20 } } },
   { id: 'outra', nome: 'Fora da campanha' },
 ]));
 try {
   render(<CampanhaDashboard sistemaPainel="ordem" />);
   fireEvent.click(await screen.findByText(ordem.nome, { selector: 'h3' }));
   fireEvent.click(await screen.findByRole('button', { name: /Fichas dos jogadores/ }));
   expect(await screen.findByText('Nenhuma ficha vinculada à campanha.')).toBeInTheDocument();
   buscarCampanhaPorCodigo.mockResolvedValue(ordem);
   fireEvent.focus(window);
   expect(await screen.findByText('14 / 20')).toBeInTheDocument();
   expect(screen.getByText('15%')).toBeInTheDocument();
   expect(screen.getByText('Ficha indisponível para consulta neste navegador.')).toBeInTheDocument();
   expect(screen.queryByText('Fora da campanha')).not.toBeInTheDocument();
 } finally {
   localStorage.removeItem('ordem:fichas:v1');
 }
});
test('o modal de nova cena mostra o seletor de cutscene e salva o projeto escolhido',async()=>{
 window.history.replaceState({},'', '/?mestre=1');
 listarCampanhas.mockResolvedValue([campaign]);buscarCampanhaPorCodigo.mockResolvedValue(campaign);salvarCena.mockResolvedValue({id:'new'});
 render(<CampanhaDashboard/>);
 fireEvent.click(await screen.findByText('Campanha Cutscene',{selector:'h3'}));
 fireEvent.click(await screen.findByRole('button',{name:'Nova cena'}));
 expect(screen.getByRole('region',{name:'Cutscene da cena'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Nome',{exact:true}),{target:{value:'Cena com cutscene'}});
 fireEvent.change(screen.getByLabelText('Cutscene desta cena'),{target:{value:'source'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar cena'}));
 await waitFor(()=>expect(salvarCena).toHaveBeenCalledWith('campaign',expect.objectContaining({nome:'Cena com cutscene',cenaEspecial:expect.objectContaining({cutscene:project,cutsceneSourceId:'source',tipoMidia:'cutscene'})})));
});

test('um mestre novo começa sem campanhas e só registra a mesa criada no sistema selecionado', async () => {
 jest.clearAllMocks();
 window.history.replaceState({}, '', '/?mestre=1&campanhaPainel=TEST12');
 const storageKey = 'darkness:campanhas:mestre:conta-nova';
 const nova = { ...campaign, sistema: 'ordem', codigo: 'NOIT43', nome: 'Noite' };
 criarCampanhaMesa.mockResolvedValue(nova);
 buscarCampanhaPorCodigo.mockResolvedValue(nova);
 try {
   render(<CampanhaDashboard mestreId="conta-nova" sistemaPainel="ordem" />);
   expect(await screen.findByText('Nenhuma campanha criada')).toBeInTheDocument();
   expect(listarCampanhas).not.toHaveBeenCalled();
   expect(buscarCampanhaPorCodigo).not.toHaveBeenCalled();
   fireEvent.click(screen.getAllByRole('button', { name: /nova campanha/i })[0]);
   expect(await screen.findByLabelText('Sistema da campanha')).toHaveValue('ordem');
   expect(screen.queryByRole('radio', { name: /Tabletop 3D/ })).not.toBeInTheDocument();
   const nome = screen.getByLabelText('Nome da campanha');
   fireEvent.change(nome, { target: { value: 'Noite' } });
   fireEvent.change(screen.getByLabelText(/Código da campanha/), { target: { value: 'noit43' } });
   fireEvent.submit(nome.form);
   await waitFor(() => expect(criarCampanhaMesa).toHaveBeenCalledWith('Noite', '2d', 'ordem', 'NOIT43'));
   await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey))).toEqual(['NOIT43']));
   expect(await screen.findByRole('link', { name: 'Abrir mesa 2D de Ordem' })).toHaveAttribute('href', '/?campanha=NOIT43&papel=mestre&sistema=ordem');
   fireEvent.click(screen.getByRole('button', { name: 'Copiar link de convite' }));
   expect(await screen.findByLabelText('Link para os jogadores')).toHaveValue(`${window.location.origin}/?conviteCampanha=NOIT43`);
 } finally {
   localStorage.removeItem(storageKey);
 }
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { MESTRE_AUTH_KEY, TABLETOP_3D_AUTH_KEY } from './constants/masterAccess';
import { registrarMestre, listarUsuarios, sessaoMestre } from './services/masterAccounts';
import { STORAGE_KEY as ORDEM_SHEETS } from './services/ordemSheet';
jest.mock('./services/masterAccounts', () => ({ sessaoMestre: jest.fn(), listarUsuarios: jest.fn(), registrarMestre: jest.fn(), codigoJogadorDoMestre: () => null }));
jest.mock('./pages/pageTransition', () => () => null);
jest.mock('./components/ui/DialogoGlobal', () => () => null);
jest.mock('./pages/lojaEspiral', () => () => null);
jest.mock('./pages/transformacaoEspiral', () => () => null);
jest.mock('./pages/mesa', () => () => <div>Mesa 2D de teste</div>);
jest.mock('./pages/Tabletop3D', () => () => <div>Mesa 3D de teste</div>);
jest.mock('./pages/CriadorCutscene', () => () => <div>Estúdio independente de teste</div>);
jest.mock('./pages/telaInicial', () => () => <div>Acesso do mestre de teste</div>);
jest.mock('./pages/dashboardMestre', () => ({ abaIntegrada }) => <div>Ferramenta carregada: {abaIntegrada}</div>);
jest.mock('./components/campanha/CampanhaDashboard', () => ({ mestreId, sistemaPainel }) => <div>Campanhas de {mestreId} em {sistemaPainel}</div>);
beforeEach(()=>{sessaoMestre.mockResolvedValue(null);sessionStorage.clear();window.history.replaceState({},'', '/?campanha=TEST78&papel=mestre&tabletop3d=1');});
test('uma URL direta do 3D exige login de proprietário', async ()=>{
  window.history.replaceState({},'', '/?campanha=TEST78&tabletop3d=1');
  render(<App />);
  expect(await screen.findByText('Acesso do mestre de teste')).toBeInTheDocument();
  expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
});
test('a sessão verificada do proprietário abre a mesa 3D',async ()=>{
  sessaoMestre.mockResolvedValue({ papel: 'proprietario' });render(<App />);
  expect(await screen.findByText('Mesa 3D de teste')).toBeInTheDocument();
  expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
});
test.each(['tabletop3d', 'criarMapa3d'])('uma conta de mestre não abre a rota %s', async rota => {
  window.history.replaceState({}, '', `/?campanha=TEST78&papel=mestre&${rota}=1`);
  sessaoMestre.mockResolvedValue({ papel: 'mestre' });
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Tabletop 3D exclusivo do proprietário' })).toBeInTheDocument();
});
test('flags antigas de sessão não abrem a mesa como mestre', async () => {
  sessionStorage.setItem(MESTRE_AUTH_KEY, 'true');
  sessionStorage.setItem(TABLETOP_3D_AUTH_KEY, 'true');
  render(<App />);
  expect(await screen.findByText('Acesso do mestre de teste')).toBeInTheDocument();
});

test('a rota de cutscene prevalece sobre a mesa e recebe título próprio',async()=>{
 window.history.replaceState({},'', '/?cutscene=1&campanha=TEST78&cena=scene1');
 sessaoMestre.mockResolvedValue({ papel: 'mestre' });render(<App/>);
 expect(await screen.findByText('Estúdio independente de teste')).toBeInTheDocument();
 expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
 expect(document.title).toBe('Estúdio de cutscenes');
});
test('a URL do estúdio exige autorização do mestre e não cai no tabletop',async()=>{
 window.history.replaceState({},'', '/?cutscene=1&campanha=TEST78');render(<App/>);
 expect(await screen.findByText('Acesso do mestre de teste')).toBeInTheDocument();
 expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
 expect(screen.queryByText('Estúdio independente de teste')).toBeNull();
});

test('o proprietário consulta os mestres cadastrados no painel exclusivo', async () => {
 window.history.replaceState({}, '', '/?master=1');
 sessaoMestre.mockResolvedValue({ nome: 'Proprietário', papel: 'proprietario' });
 listarUsuarios.mockImplementation(async grupo => ({
   usuarios: grupo === 'mestres' ? [{ id: 2, nome: 'Bianca', papel: 'mestre' }] : [{ id: 1, nome: 'Ana', papel: 'jogador' }],
   mais: false,
 }));
 render(<App />);
 expect(await screen.findByRole('heading', { name: 'Dashboard Master' })).toBeInTheDocument();
 expect(await screen.findByText('Ana')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Mestres' }));
 expect(await screen.findByText('Bianca')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: 'Painel do Mestre' }));
 expect(await screen.findByText('Ferramenta carregada: campanha')).toBeInTheDocument();
 expect(screen.getByRole('link', { name: 'Abrir painel dos mestres' })).toHaveAttribute('href', '/?mestre=1');
 fireEvent.click(screen.getByRole('button', { name: 'Rolagens de campo' }));
 expect(await screen.findByText('Ferramenta carregada: rolagens')).toBeInTheDocument();
 expect(window.location.search).toBe('?master=1');
 fireEvent.click(screen.getByRole('button', { name: 'Dashboard Master' }));
 expect(await screen.findByText('Bianca')).toBeInTheDocument();
});

test('o autocadastro está disponível para visitantes', async () => {
 window.history.replaceState({}, '', '/?mestre=novo');
 registrarMestre.mockRejectedValue(new Error('Escolha outro código de mestre.'));
 render(<App />);
 expect(await screen.findByRole('heading', { name: 'Cadastro de mestre' })).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Nome do mestre'), { target: { value: 'Bianca' } });
 fireEvent.change(screen.getByLabelText('Código de mestre'), { target: { value: '0942' } });
 fireEvent.click(screen.getByRole('button', { name: 'Criar conta de mestre' }));
 expect(await screen.findByRole('alert')).toHaveTextContent('Escolha outro código de mestre.');
 expect(registrarMestre).toHaveBeenCalledWith('Bianca', '0942');
});

test('Ordem Paranormal tem fichas, habilidades e acervo separados das ferramentas de Darkness', async () => {
 window.history.replaceState({}, '', '/?master=1');
 sessaoMestre.mockResolvedValue({ nome: 'Proprietário', papel: 'proprietario' });
 listarUsuarios.mockResolvedValue({ usuarios: [], mais: false });
 localStorage.setItem(ORDEM_SHEETS, JSON.stringify([{ id: 'agente-ordem', nome: 'Agente Diana', classe: 'Combatente', nex: 10 }]));
 try {
   render(<App />);
   fireEvent.click(await screen.findByRole('button', { name: 'Painel do Mestre' }));
   expect(await screen.findByText('Ferramenta carregada: campanha')).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Ordem Paranormal' }));
   expect(await screen.findByRole('link', { name: /Agente Diana/ })).toHaveAttribute('href', '/?ordem=1&agente=agente-ordem');
   expect(screen.queryByRole('button', { name: 'Campanhas' })).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Habilidades' }));
   expect(screen.getByRole('heading', { name: 'Habilidades de Ordem Paranormal' })).toBeInTheDocument();
   expect(screen.queryByRole('button', { name: /Rituais/ })).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Paranormal' }));
   expect(screen.getByRole('heading', { name: 'Rituais de Ordem Paranormal' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: /^Energia/ }));
   const ritual = screen.getByRole('heading', { name: 'Alterar Destino' }).closest('li');
   expect(ritual).toHaveAttribute('data-element', 'energia');
   expect(ritual.querySelector('[data-sigil="energia"]')).toBeInTheDocument();
   const dialogPrototype = HTMLDialogElement.prototype;
   const originalShowModal = dialogPrototype.showModal;
   const originalClose = dialogPrototype.close;
   dialogPrototype.showModal = function () { this.setAttribute('open', ''); };
   dialogPrototype.close = function () { this.removeAttribute('open'); fireEvent(this, new Event('close')); };
   try {
     fireEvent.click(screen.getByRole('button', { name: 'Consultar ritual Alterar Destino' }));
     const reader = screen.getByRole('dialog', { name: 'Alterar Destino' });
     expect(reader).toHaveTextContent('Alcance');
     expect(ritual).not.toHaveTextContent('Alcance');
     fireEvent.click(screen.getByRole('button', { name: 'Fechar ritual' }));
     expect(screen.queryByRole('dialog', { name: 'Alterar Destino' })).not.toBeInTheDocument();
   } finally {
     dialogPrototype.showModal = originalShowModal;
     dialogPrototype.close = originalClose;
   }
   fireEvent.click(screen.getByRole('button', { name: 'Círculo I' }));
   expect(screen.queryByRole('heading', { name: 'Alterar Destino' })).not.toBeInTheDocument();
   expect(screen.getByRole('heading', { name: 'Amaldiçoar Arma (Energia)' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Poderes Paranormais' }));
   expect(screen.getByRole('heading', { name: 'Poderes Paranormais' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: /^Sangue/ }));
   expect(screen.getByRole('heading', { name: 'Anatomia Insana' }).closest('li')).toHaveAttribute('data-element', 'sangue');
   fireEvent.click(screen.getByRole('button', { name: 'Acervo' }));
   expect(screen.getByRole('heading', { name: 'Acervo de Ordem Paranormal' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Encontros' }));
   expect(screen.getByRole('heading', { name: 'Ameaças de Ordem Paranormal' })).toBeInTheDocument();
   expect(screen.queryByRole('region', { name: 'Detalhes da ameaça' })).not.toBeInTheDocument();
   const card = screen.getByRole('button', { name: /Aniquilação/ });
   fireEvent.click(card);
   expect(card).toHaveAttribute('aria-expanded', 'true');
   expect(screen.getByRole('heading', { name: 'Aniquilação' })).toBeInTheDocument();
   const banner = screen.getByRole('heading', { name: 'Aniquilação' }).closest('.ot-title-banner');
   expect(banner.querySelector('[data-sigil="sangue"]')).toBeInTheDocument();
   expect(banner.querySelector('.ot-vd')).toHaveTextContent('VD380');
   expect(screen.getByRole('region', { name: 'Detalhes da ameaça' }).querySelector('img')).toBeNull();
   expect(document.querySelector('.master-dashboard-art img')).toHaveAttribute('src', '/ordem-ameacas/criatura-186.webp');
   expect(screen.getByText('1200 | 600 machucado')).toBeInTheDocument();
   expect(screen.getByRole('heading', { name: /TEMPESTADE DE ESPINHOS/ })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Fechar ficha' }));
   expect(card).toHaveAttribute('aria-expanded', 'false');
   expect(document.querySelector('.master-dashboard-art')).toBeNull();
   fireEvent.click(screen.getByRole('button', { name: 'Ameaças da Realidade' }));
   fireEvent.click(screen.getByRole('button', { name: /bandido/ }));
   expect(screen.getByRole('heading', { name: 'bandido' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Perigos mundanos' }));
   fireEvent.click(screen.getByRole('button', { name: /ácido/ }));
   expect(screen.getByRole('heading', { name: 'ácido' })).toBeInTheDocument();
   expect(screen.getByText(/10d6 pontos de dano químico/)).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Darkness' }));
   expect(await screen.findByText('Ferramenta carregada: campanha')).toBeInTheDocument();
   expect(screen.queryByRole('link', { name: /Agente Diana/ })).not.toBeInTheDocument();
 } finally {
   localStorage.removeItem(ORDEM_SHEETS);
 }
});

test('uma conta de mestre recebe um link para o painel de mestres ao tentar abrir o painel do proprietário', async () => {
 window.history.replaceState({}, '', '/?master=1');
 sessaoMestre.mockResolvedValue({ papel: 'mestre' });
 render(<App />);
 expect(await screen.findByRole('heading', { name: 'Acesso reservado ao proprietário' })).toBeInTheDocument();
 expect(screen.getByRole('link', { name: 'Abrir Painel de Mestre' })).toHaveAttribute('href', '/?mestre=1');
});

test('o novo mestre troca de sistema sem receber as campanhas ou rolagens do proprietário', async () => {
 const id = 'novo-mestre-teste';
 localStorage.setItem(`darkness:painel:mestre:sistema:${id}`, 'espiral');
 window.history.replaceState({}, '', '/?mestre=1');
 sessaoMestre.mockResolvedValue({ id, nome: 'Novo Mestre', papel: 'mestre' });
 try {
   render(<App />);
   const darkness = await screen.findByRole('button', { name: 'Darkness' });
   expect(screen.getByRole('link', { name: 'Meus personagens' })).toHaveAttribute('href', '/?mestre=1&personagens=1');
   expect(darkness).toHaveAttribute('aria-pressed', 'true');
   expect(await screen.findByText(`Campanhas de ${id} em absoluto`)).toBeInTheDocument();
   expect(screen.queryByText('Rolagens de campo')).not.toBeInTheDocument();
   expect(screen.queryByRole('button', { name: 'ESPIRAL' })).not.toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Personagens' }));
   expect(screen.getByRole('link', { name: 'Abrir meus personagens' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Encontros' }));
   expect(await screen.findByRole('button', { name: 'Criar NPC' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Acervo' }));
   expect(await screen.findByRole('searchbox', { name: 'Buscar equipamentos' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Habilidades' }));
   const [verNiveis] = await screen.findAllByRole('button', { name: 'Ver níveis' });
   fireEvent.click(verNiveis);
   expect(screen.getByRole('dialog', { name: 'Níveis da habilidade' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Ordem Paranormal' }));
   expect(await screen.findByText(`Campanhas de ${id} em ordem`)).toBeInTheDocument();
   expect(localStorage.getItem(`darkness:painel:mestre:sistema:${id}`)).toBe('ordem');
 } finally {
   localStorage.removeItem(`darkness:painel:mestre:sistema:${id}`);
 }
});

test('a aba de Ordem no Painel do Mestre abre as ferramentas com o fundo próprio', async () => {
 window.history.replaceState({}, '', '/?mestre=1&sistema=ordem');
 sessaoMestre.mockResolvedValue({ nome: 'Proprietário', papel: 'proprietario' });
 render(<App />);
 expect(await screen.findByRole('heading', { name: 'Ameaças de Ordem Paranormal' })).toBeInTheDocument();
 expect(screen.getByRole('main').style.getPropertyValue('--ordem-master-sigil')).toContain('ordem-dashboard-fundo.png');
 expect(screen.getByRole('link', { name: 'Darkness' })).toHaveAttribute('href', '/?mestre=1');
 expect(screen.getByRole('link', { name: 'Ordem Paranormal' })).toHaveAttribute('aria-current', 'page');
 fireEvent.click(screen.getByRole('button', { name: 'Acervo' }));
 expect(screen.getByRole('heading', { name: 'Acervo de Ordem Paranormal' })).toBeInTheDocument();
});

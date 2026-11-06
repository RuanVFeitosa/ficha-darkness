import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { MESTRE_AUTH_KEY, TABLETOP_3D_AUTH_KEY } from './constants/masterAccess';
jest.mock('./pages/pageTransition', () => () => null);
jest.mock('./components/ui/DialogoGlobal', () => () => null);
jest.mock('./pages/lojaEspiral', () => () => null);
jest.mock('./pages/transformacaoEspiral', () => () => null);
jest.mock('./pages/mesa', () => () => <div>Mesa 2D de teste</div>);
jest.mock('./pages/Tabletop3D', () => () => <div>Mesa 3D de teste</div>);
jest.mock('./pages/CriadorCutscene', () => () => <div>Estúdio independente de teste</div>);
jest.mock('./pages/telaInicial', () => () => <div>Acesso do mestre de teste</div>);
beforeEach(()=>{sessionStorage.clear();window.history.replaceState({},'', '/?campanha=TEST78&papel=mestre&tabletop3d=1');});
test('direct 3D links without tab authorization show access instead of an empty 2D scene', async ()=>{
  render(<App />);
  expect(await screen.findByRole('heading',{name:'Abrir tabletop 3D'})).toBeInTheDocument();
  expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
});
test.each([MESTRE_AUTH_KEY,TABLETOP_3D_AUTH_KEY])('authorized access opens the 3D route (%s)',async key=>{
  sessionStorage.setItem(key,'true');render(<App />);
  expect(await screen.findByText('Mesa 3D de teste')).toBeInTheDocument();
  expect(screen.queryByText('Mesa 2D de teste')).toBeNull();
});

test('a rota de cutscene prevalece sobre a mesa e recebe título próprio',async()=>{
 window.history.replaceState({},'', '/?cutscene=1&campanha=TEST78&cena=scene1');
 sessionStorage.setItem(MESTRE_AUTH_KEY,'true');render(<App/>);
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

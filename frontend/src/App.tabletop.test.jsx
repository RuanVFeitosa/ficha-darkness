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

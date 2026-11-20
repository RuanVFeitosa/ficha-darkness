import { act, renderHook } from '@testing-library/react';
import useMasterSheetViewer from './useMasterSheetViewer';

test('clicar em Jorge fecha o dossiê antigo de Ellie em vez de sobrepor duas fichas', () => {
  const { result } = renderHook(() => useMasterSheetViewer());
  act(() => result.current.setModalFichaAberto(true));
  expect(result.current.modalFichaAberto).toBe(true);
  const jorge = { fichaId: 'espiral:96582552', personagem: { name: 'Jorge' } };
  act(() => result.current.setFichaEspiralAberta(jorge));
  expect(result.current.modalFichaAberto).toBe(false);
  expect(result.current.fichaEspiralAberta).toBe(jorge);
  // Fechamentos atrasados do visualizador anterior não fecham o atual.
  act(() => result.current.setModalFichaAberto(false));
  expect(result.current.fichaEspiralAberta).toBe(jorge);
});

test('troca de personagens modernos e retorno ao dossiê antigo mantêm um só visualizador', () => {
  const { result } = renderHook(() => useMasterSheetViewer());
  act(() => result.current.setFichaEspiralAberta({ fichaId: 'espiral:jorge' }));
  act(() => result.current.setFichaEspiralAberta({ fichaId: 'espiral:victoria' }));
  expect(result.current.fichaEspiralAberta.fichaId).toBe('espiral:victoria');
  act(() => result.current.setFichaEspiralAberta(sheet => ({ ...sheet, atualizado: true })));
  expect(result.current.fichaEspiralAberta.atualizado).toBe(true);
  act(() => result.current.setModalFichaAberto(true));
  expect(result.current.fichaEspiralAberta).toBeNull();
  expect(result.current.modalFichaAberto).toBe(true);
  act(() => result.current.setFichaEspiralAberta(null));
  expect(result.current.modalFichaAberto).toBe(true);
  act(() => result.current.setModalFichaAberto(false));
  expect(result.current.modalFichaAberto).toBe(false);
});

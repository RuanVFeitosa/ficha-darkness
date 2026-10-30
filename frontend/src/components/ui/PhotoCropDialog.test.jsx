import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PhotoCropDialog } from './PhotoCropDialog';
import { photoCropRect } from '../../utils/photoCrop';

test('o recorte respeita os limites de retratos verticais, horizontais e zoom', () => {
  expect(photoCropRect(600, 1200, 1, .5, 0)).toEqual({x:0,y:0,size:600});
  expect(photoCropRect(600, 1200, 1, .5, 1)).toEqual({x:0,y:600,size:600});
  expect(photoCropRect(1200, 600, 2, 1, 1)).toEqual({x:900,y:300,size:300});
  expect(photoCropRect(600, 600, 1, -1, 2)).toEqual({x:0,y:0,size:600});
});

let draw;
beforeEach(() => {
  draw = jest.fn();
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({clearRect:jest.fn(),drawImage:draw});
  jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,crop');
  HTMLDialogElement.prototype.showModal = jest.fn(function () { this.setAttribute('open', ''); });
  HTMLDialogElement.prototype.close = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

test('posição e zoom mudam a região exportada; restaurar recupera o centro', () => {
  const image = {naturalWidth:600,naturalHeight:1200};
  const onFinish = jest.fn();
  render(<PhotoCropDialog image={image} onFinish={onFinish}/>);
  fireEvent.change(screen.getByLabelText('Zoom da foto'), {target:{value:'2'}});
  fireEvent.change(screen.getByLabelText('Posição vertical da foto'), {target:{value:'0'}});
  fireEvent.click(screen.getByRole('button', {name:'Usar enquadramento'}));
  expect(draw).toHaveBeenLastCalledWith(image,150,0,300,300,0,0,512,512);
  expect(onFinish).toHaveBeenCalledWith('data:image/png;base64,crop');
  fireEvent.click(screen.getByRole('button', {name:'Restaurar'}));
  expect(draw).toHaveBeenLastCalledWith(image,0,300,600,600,0,0,512,512);
});

test('cancelar não exporta ou substitui a foto', () => {
  const onFinish = jest.fn();
  render(<PhotoCropDialog image={{naturalWidth:600,naturalHeight:1200}} onFinish={onFinish}/>);
  fireEvent.click(screen.getByRole('button', {name:'Cancelar'}));
  expect(onFinish).toHaveBeenCalledWith(null);
  expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled();
});

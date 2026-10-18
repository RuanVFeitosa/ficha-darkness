import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import TokenAnimationPreview,{fitTokenImage} from './TokenAnimationPreview';
import {normalizeTokenAnimation} from '../../utils/tokenAnimation';
afterEach(cleanup);
test('fits the entire image into portrait and landscape panels',() => {for(const [width,height,aspect] of [[250,420,2/3],[700,200,2],[320,540,3]]){const fit=fitTokenImage(width,height,aspect);expect(fit.width).toBeLessThan(width);expect(fit.height).toBeLessThan(height);expect(fit.width/fit.height).toBeCloseTo(aspect);}});
test('preview works without creating any canvas or WebGL context',() => {const context=jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(() => {throw new Error('WebGL unavailable');});const {container}=render(<TokenAnimationPreview image="/vic.png" animation={normalizeTokenAnimation({enabled:false,closedImage:'/closed.png'})}/>);expect(screen.getByAltText('Prévia animada do token')).toHaveAttribute('src','/vic.png');expect(container.querySelector('canvas')).toBeNull();expect(context).not.toHaveBeenCalled();expect(container.querySelector('.tas-image-eyes')).toHaveStyle({opacity:'0'});context.mockRestore();});
test('cancels animation frames on unmount',() => {const cancel=jest.spyOn(window,'cancelAnimationFrame');const {unmount}=render(<TokenAnimationPreview image="/vic.png" animation={normalizeTokenAnimation()}/>);unmount();expect(cancel).toHaveBeenCalled();cancel.mockRestore();});

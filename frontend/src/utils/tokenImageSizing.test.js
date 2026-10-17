import {visiblePixelBounds} from './tokenImageSizing';
test('transparent pose margins are removed without changing the figure proportions',() => {const w=10,h=12,pixels=new Uint8ClampedArray(w*h*4);for(let y=2;y<=9;y++)for(let x=3;x<=6;x++)pixels[(y*w+x)*4+3]=255;expect(visiblePixelBounds(pixels,w,h)).toEqual({x:3,y:2,width:4,height:8});});
test('empty images have a safe full-canvas fallback',() => {expect(visiblePixelBounds(new Uint8ClampedArray(16),2,2)).toEqual({x:0,y:0,width:2,height:2});});

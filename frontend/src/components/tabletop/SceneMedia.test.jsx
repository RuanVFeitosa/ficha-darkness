import React from 'react';
import {render,screen} from '@testing-library/react';
import SceneMedia from './SceneMedia';
test('reproduz vídeos em loop sem áudio e preserva GIFs',()=>{
 const {rerender,container}=render(<SceneMedia media={{url:'/battle.mp4?token=1'}} alt="Mapa"/>);
 const video=container.querySelector('video');
 expect(video).toHaveAttribute('autoplay');expect(video).toHaveAttribute('loop');expect(video).toHaveAttribute('playsinline');expect(video.muted).toBe(true);
 rerender(<SceneMedia media={{url:'/scene.gif'}} alt="Cena"/>);
 expect(screen.getByAltText('Cena')).toHaveAttribute('src','/scene.gif');expect(container.querySelector('video')).toBeNull();
});
test('reconhece arquivo de vídeo na prévia',()=>{
 const {container}=render(<SceneMedia src="blob:preview" file={new File(['data'],'map.webm',{type:'video/webm'})}/>);
 expect(container.querySelector('video')).toHaveAttribute('src','blob:preview');
});

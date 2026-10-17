import React from 'react';
import {render,screen} from '@testing-library/react';
import AnimatedTokenImage from './AnimatedTokenImage';
import {normalizeTokenAnimation} from '../utils/tokenAnimation';
test('profile uses its own animation without opening WebGL',() => {const {container}=render(<AnimatedTokenImage src="/portrait.png" alt="Victoria" animation={normalizeTokenAnimation({image:'/portrait.png'})}/>);expect(screen.getByAltText('Victoria')).toHaveAttribute('src','/portrait.png');expect(container.querySelector('canvas')).toBeNull();expect(container.querySelector('.tas-image-preview')).not.toBeNull();});
test('replacing a portrait does not display the old image or blink frame',() => {const {container}=render(<AnimatedTokenImage src="/new.png" alt="Perfil" animation={normalizeTokenAnimation({image:'/old.png',closedImage:'/old-closed.png'})}/>);expect(screen.getByAltText('Perfil')).toHaveAttribute('src','/new.png');expect(container.querySelector('.tas-image-preview')).toBeNull();});

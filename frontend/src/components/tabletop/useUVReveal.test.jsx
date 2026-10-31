import React from 'react';
import {render} from '@testing-library/react';
import {useFrame} from '@react-three/fiber';
import useUVReveal from './useUVReveal';
import {revealedByUV} from '../../utils/uvVisibility';
jest.mock('../../utils/uvVisibility',()=>({uvVisibilityTools:()=>({}),revealedByUV:jest.fn()}));
jest.mock('@react-three/fiber',()=>({useThree:()=>({scene:{}}),useFrame:jest.fn()}));
test('pista acompanha revelação UV e mestre pode editar sem iluminar',()=>{
 const object={visible:false};
 function Demo({mestre=false}){useUVReveal({current:object},true,mestre,.3);return null;}
 const {rerender}=render(<Demo/>);
 const frame=()=>useFrame.mock.calls[useFrame.mock.calls.length-1][0]({},.1);
 revealedByUV.mockReturnValue(true);frame();expect(object.visible).toBe(true);
 revealedByUV.mockReturnValue(false);frame();expect(object.visible).toBe(false);
 rerender(<Demo mestre/>);frame();expect(object.visible).toBe(true);
});

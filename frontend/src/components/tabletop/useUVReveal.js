import {useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {uvVisibilityTools,revealedByUV} from '../../utils/uvVisibility';

// Use the actual light transforms, including camera aim and token elevation.
export default function useUVReveal(ref,uvOnly,mestre,height){
 const {scene}=useThree();const elapsed=useRef(0);
 const vectors=useMemo(uvVisibilityTools,[]);
 useFrame((_,delta)=>{
  const object=ref.current;if(!object)return;
  if(!uvOnly || mestre){object.visible=true;return;}
  elapsed.current+=delta;if(elapsed.current<.08)return;elapsed.current=0;
  object.visible=revealedByUV(object,scene,vectors,height);

 });
}

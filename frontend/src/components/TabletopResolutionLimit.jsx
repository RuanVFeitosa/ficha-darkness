import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {tabletopRenderDpr} from '../utils/tabletopRenderer';
export default function TabletopResolutionLimit() {
 const {size,setDpr}=useThree();
 useLayoutEffect(() => {setDpr(tabletopRenderDpr(size.width,size.height));},[size.width,size.height,setDpr]);
 return null;
}

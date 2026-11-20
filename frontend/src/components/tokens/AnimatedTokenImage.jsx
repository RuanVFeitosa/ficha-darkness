import {automaticTokenAnimation} from '../../utils/tokenAnimation';
import React,{useState,useMemo} from 'react';
import TokenAnimationPreview from './TokenAnimationPreview';
export default function AnimatedTokenImage({src,animation,alt='',className='',style,fit='cover',overscan=1,...props}) {
 const [aspect,setAspect]=useState(1);
 const config=useMemo(()=>automaticTokenAnimation(src,animation),[src,animation]);
 if(!src || !config.enabled) return <img src={src} alt={alt} className={className} style={style} {...props}/>;
 return <span className={className} style={{display:'block',position:'relative',overflow:'hidden',...(className ? {} : {width:'100%',height:'100%'}),...style}}>
  <img src={src} alt="" aria-hidden="true" style={{width:'100%',height:'100%',opacity:0,display:'block'}} onLoad={e => setAspect(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight || 1)}/>
  <TokenAnimationPreview image={src} animation={config} id={src.slice(-64)} aspect={aspect} fit={fit} overscan={overscan} alt={alt}/>
 </span>;
}

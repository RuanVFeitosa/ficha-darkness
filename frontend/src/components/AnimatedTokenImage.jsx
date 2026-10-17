import React,{useState} from 'react';
import TokenAnimationPreview from './TokenAnimationPreview';
export default function AnimatedTokenImage({src,animation,alt='',className='',style,...props}) {
 const [aspect,setAspect]=useState(1);
 if(!animation?.enabled || (animation.image && animation.image!==src)) return <img src={src} alt={alt} className={className} style={style} {...props}/>;
 return <span className={className} style={{display:'block',position:'relative',overflow:'hidden',...(className ? {} : {width:'100%',height:'100%'}),...style}}>
  <img src={src} alt="" aria-hidden="true" style={{width:'100%',height:'100%',opacity:0,display:'block'}} onLoad={e => setAspect(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight || 1)}/>
  <TokenAnimationPreview image={src} animation={animation} id={src.slice(-64)} aspect={aspect} fit="cover" alt={alt}/>
 </span>;
}

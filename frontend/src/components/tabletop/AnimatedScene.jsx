import React from 'react';
import TokenAnimationPreview from '../tokens/TokenAnimationPreview';
import {normalizeTokenAnimation} from '../../utils/tokenAnimation';
import '../../styles/SceneAnimation.css';

export default function AnimatedScene({media,src=media?.url,alt='Cena narrativa',id}) {
 const animation=media?.animation;
 if(!src || !animation?.enabled)return null;
 const config={...normalizeTokenAnimation(animation),image:src,cropTransparent:false};
 return <div className="scene-animated-art" role="img" aria-label={alt}>
  <TokenAnimationPreview image={src} animation={config} id={id || media?.id || src} fit="cover" overscan={1.12} origin="50% 50%" alt=""/>
 </div>;
}

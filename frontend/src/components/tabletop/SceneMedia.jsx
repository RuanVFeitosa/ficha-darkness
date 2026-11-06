import React from 'react';
import {specialSceneMediaType} from '../../utils/specialSceneMedia';
export default function SceneMedia({media,src,file,alt='',...props}) {
 const url=src || media?.previewUrl || media?.url;
 return specialSceneMediaType({file,url,fallback:media?.tipoMidia})==='video' ? <video key={url} src={url} aria-label={alt || undefined} autoPlay muted loop playsInline {...props}/> : <img src={url} alt={alt} {...props}/>;
}

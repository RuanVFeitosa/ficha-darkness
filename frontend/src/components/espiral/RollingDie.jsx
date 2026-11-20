import React, { useEffect, useId, useState } from 'react';
import '../../styles/RollingDie.css';

const shapes = {
  4: { outline:'60,8 112,103 8,103', facets:['M60 8 L60 67 L8 103 M60 67 L112 103'], y:78 },
  6: { outline:'29,18 90,18 109,37 109,98 48,98 29,79', facets:['M29 18 L48 37 L109 37 M48 37 L48 98 M90 18 L90 79 L29 79'], y:72 },
  8: { outline:'60,6 110,57 60,110 10,57', facets:['M60 6 L34 75 L86 75 Z M10 57 L34 75 L60 110 L86 75 L110 57'], y:65 },
  10: { outline:'60,7 111,44 93,103 27,103 9,44', facets:['M60 7 L60 36 L27 103 M60 36 L93 103 M9 44 L60 36 L111 44'], y:73 },
  12: { outline:'31,9 88,9 115,57 88,106 31,106 5,57', facets:['M60 25 L91 47 L79 84 L41 84 L29 47 Z M31 9 L60 25 L88 9 M115 57 L91 47 M88 106 L79 84 M31 106 L41 84 M5 57 L29 47'], y:65 },
  20: { outline:'60,5 108,32 108,88 60,115 12,88 12,32', facets:['M60 5 L35 45 L85 45 Z M35 45 L60 88 L85 45 M12 32 L35 45 L12 88 L60 88 L108 88 L85 45 L108 32 M60 88 L60 115'], y:66 },
};

const facePlanes={
4:['60,8 60,67 8,103','60,8 112,103 60,67'],
6:['29,18 90,18 109,37 48,37','29,18 48,37 48,98 29,79'],
8:['60,6 34,75 10,57','60,6 110,57 86,75','34,75 86,75 60,110'],
10:['60,7 60,36 9,44','60,7 111,44 60,36','9,44 60,36 27,103','60,36 111,44 93,103'],
12:['31,9 88,9 60,25','5,57 31,9 60,25 29,47','88,9 115,57 91,47 60,25','115,57 88,106 79,84 91,47','31,106 88,106 79,84 41,84'],
20:['60,5 35,45 12,32','60,5 108,32 85,45','12,32 35,45 12,88','85,45 108,32 108,88','12,88 60,88 60,115','60,88 108,88 60,115']};

export default function RollingDie({ sides, value, rolling, index = 0 }) {
  const id = useId().replace(/:/g,'');
  const [frame,setFrame] = useState(1);
  useEffect(()=>{
    if(!rolling || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return undefined;
    let tick=index*3;
    const timer=setInterval(()=>setFrame((++tick*7)%sides+1),70);
    return ()=>clearInterval(timer);
  },[rolling,sides,index]);
  const shape = shapes[sides] || shapes[20];
  return <div className={`pd-physical-die ${rolling?'is-tumbling':'is-settled'}`} style={{'--die-tilt':`${[-11,7,-4,12,-7,4][index%6]}deg`,'--die-rest-y':`${[3,-4,2,-2,4,0][index%6]}px`,'--die-turn':`${index%2?-1:1}`}}>
    <svg viewBox="0 0 120 125" role="img" aria-label={`d${sides}: ${rolling?'rolando':value}`}>
      <defs><linearGradient id={`die-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--die-light)"/><stop offset="1" stopColor="var(--die-dark)"/></linearGradient></defs>
      <polygon className="pd-die-outline" points={shape.outline} fill={`url(#die-${id})`}/>
      {(facePlanes[sides]||facePlanes[20]).map((points,i)=><polygon points={points} className={`pd-die-plane plane-${i%3}`} key={i}/>)}
      <polygon points={shape.outline} className="pd-die-rim"/>
      {shape.facets.map((path,i)=><path className="pd-die-facet" d={path} key={i}/>)}
      <text x={sides===6?77:60} y={shape.y} textAnchor="middle" className="pd-die-number">{rolling?frame:value}</text>
    </svg>
    <i className="pd-die-ground" aria-hidden="true"/>
  </div>;
}

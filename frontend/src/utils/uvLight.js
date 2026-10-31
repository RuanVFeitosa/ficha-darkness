export function insideUVBeam(point,origin,direction,range,angle){
 const offset=point.map((value,index)=>value-origin[index]);
 const distance=Math.hypot(...offset),length=Math.hypot(...direction);
 if(!length || distance>range || distance<.001) return false;
 return offset.reduce((sum,value,index)=>sum+value*direction[index],0)/(distance*length)>=Math.cos(angle);
}

export function uvTextImage(text){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const context=canvas.getContext('2d');
 if(!context)throw new Error('Não foi possível criar a pista UV.');
 context.font='bold 52px sans-serif';context.textAlign='center';context.textBaseline='middle';
 context.fillStyle='#d7b4ff';context.shadowColor='#9f50ff';context.shadowBlur=10;
 const words=String(text).trim().slice(0,240).split(/\s+/);const lines=[];let line='';
 words.forEach(word=>{const next=line ? `${line} ${word}` : word;if(context.measureText(next).width>920 && line){lines.push(line);line=word;}else line=next;});
 if(line)lines.push(line);
 lines.slice(0,7).forEach((value,index)=>context.fillText(value,512,256+(index-(Math.min(lines.length,7)-1)/2)*62,920));
 return canvas.toDataURL('image/png');
}

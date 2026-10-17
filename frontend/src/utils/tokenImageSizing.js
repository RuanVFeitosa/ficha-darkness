const boundsCache=new WeakMap();
export function visiblePixelBounds(data,width,height) {
 let left=width,right=-1,top=height,bottom=-1;
 for(let y=0;y<height;y++) for(let x=0;x<width;x++) if(data[(y*width+x)*4+3]>=8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right>=left ? {x:left,y:top,width:right-left+1,height:bottom-top+1} : {x:0,y:0,width,height};
}
export function tokenImageBounds(image,crop=false) {
 const width=image.naturalWidth || image.width,height=image.naturalHeight || image.height;
 if(!crop) return {x:0,y:0,width,height};
 if(boundsCache.has(image)) return boundsCache.get(image);
 let bounds={x:0,y:0,width,height};
 try {const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);bounds=visiblePixelBounds(context.getImageData(0,0,width,height).data,width,height);} catch {}
 boundsCache.set(image,bounds);return bounds;
}
export function croppedTokenData(image) {
 const bounds=tokenImageBounds(image,true),canvas=document.createElement('canvas');canvas.width=bounds.width;canvas.height=bounds.height;
 canvas.getContext('2d').drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height,0,0,bounds.width,bounds.height);
 return {url:canvas.toDataURL('image/webp',.9),aspect:bounds.width/bounds.height};
}

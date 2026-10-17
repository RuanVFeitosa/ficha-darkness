export function createTabletopRenderer(parameters,Renderer) {
 const common={...parameters,alpha:parameters.alpha ?? false,stencil:false,failIfMajorPerformanceCaveat:false};
 try {return new Renderer({...common,antialias:true,powerPreference:'default'});}
 catch {return new Renderer({...common,antialias:false,powerPreference:'low-power'});}
}
export function isWebGLCreationError(error) {
 return /WebGL|GL driver|EGL_NO_CONFIG|EXHAUSTED_DRIVERS/i.test(error?.message || String(error));
}
export function tabletop2DUrl(search) {
 const params=new URLSearchParams(search);params.delete('tabletop3d');params.delete('criarMapa3d');return '/?'+params.toString();
}
export const TABLETOP_MAX_RESOLUTION={width:1920,height:1080};
export function tabletopRenderDpr(width,height) {
 if(width<=0 || height<=0) return 1;
 return Math.min(1,TABLETOP_MAX_RESOLUTION.width/width,TABLETOP_MAX_RESOLUTION.height/height);
}


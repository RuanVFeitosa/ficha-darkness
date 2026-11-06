const FORMATS = {
 gif:'image/gif', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg',
 webp:'image/webp', avif:'image/avif', apng:'image/apng', bmp:'image/bmp',
 ico:'image/x-icon', mp4:'video/mp4', webm:'video/webm',
};
export const SPECIAL_SCENE_ACCEPT = [...new Set(Object.values(FORMATS)), ...Object.keys(FORMATS).map(ext=>`.${ext}`)].join(',');
export function specialSceneMime(file) {
 const mime=String(file?.type || '').toLowerCase();
 if(mime && mime!=='application/octet-stream') return mime==='image/x-ms-bmp' ? 'image/bmp' : mime==='image/vnd.microsoft.icon' ? 'image/x-icon' : mime;
 return FORMATS[String(file?.name || '').split('.').pop().toLowerCase()] || '';
}
export function specialSceneMediaType({file,url,fallback='imagem'}={}) {
 if(file) return specialSceneMime(file).startsWith('video/') ? 'video' : 'imagem';
 const value=String(url || '');
 if(/^data:image\//i.test(value) || /\.(gif|png|jpe?g|webp|avif|apng|bmp|ico)(?:[?#]|$)/i.test(value)) return 'imagem';
 if(/^data:video\//i.test(value) || /\.(mp4|webm)(?:[?#]|$)/i.test(value)) return 'video';
 return fallback;
}

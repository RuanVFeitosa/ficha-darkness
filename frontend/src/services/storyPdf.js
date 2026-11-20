export function pdfPageText(items) {
  let text='',previousY=null;
  for(const item of items) {
    if(typeof item.str!=='string')continue;
    const y=item.transform?.[5];
    if(previousY!==null&&y!==undefined&&Math.abs(y-previousY)>3&&!text.endsWith('\n'))text+='\n';
    else if(text&&!text.endsWith('\n')&&!text.endsWith(' '))text+=' ';
    text+=item.str;
    if(item.hasEOL)text+='\n';
    if(y!==undefined)previousY=y;
  }
  return text.trim();
}

export async function importStoryPdf(file,onProgress=()=>{}) {
  if(!file || (!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'))throw new Error('Escolha um arquivo PDF.');
  if(file.size>25*1024*1024)throw new Error('Escolha um PDF de até 25 MB.');
  const pdfjs=await import('pdfjs-dist/build/pdf.mjs');
  const assets=`${process.env.PUBLIC_URL || ''}/pdfjs/`;
  pdfjs.GlobalWorkerOptions.workerSrc=assets+'pdf.worker.min.mjs';
  pdfjs.GlobalWorkerOptions.rendererSrc=assets+'pdf.renderer.min.mjs';
  const data=await file.arrayBuffer();
  const task=pdfjs.getDocument({data,cMapUrl:assets+'cmaps/',cMapPacked:true,standardFontDataUrl:assets+'standard_fonts/',wasmUrl:assets+'wasm/',iccUrl:assets+'iccs/',isEvalSupported:false});
  let document;
  try {
    document=await task.promise;
    if(document.numPages>100)throw new Error('Importe um PDF com até 100 páginas por vez.');
    const pages=[];
    for(let number=1;number<=document.numPages;number++) {
      onProgress(number,document.numPages);
      const page=await document.getPage(number);
      const original=page.getViewport({scale:1});
      const viewport=page.getViewport({scale:Math.min(1.7,1500/Math.max(original.width,original.height))});
      const canvas=window.document.createElement('canvas');
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      const context=canvas.getContext('2d',{alpha:false});
      if(!context)throw new Error('Não foi possível preparar a visualização deste PDF.');
      try {
        await page.render({canvasContext:context,viewport,background:'#ffffff'}).promise;
        let text='';
        try{text=pdfPageText((await page.getTextContent()).items);}catch{ /* A página visual é preservada mesmo sem texto extraível. */ }
        pages.push({id:`pdf-${Date.now()}-${number}-${Math.random().toString(36).slice(2,7)}`,title:`${file.name.replace(/\.pdf$/i,'')} · ${number}`,kind:'pdf',image:canvas.toDataURL('image/webp',.85),text,source:file.name,sourcePage:number});
      } finally {canvas.width=0;canvas.height=0;page.cleanup();}
    }
    return pages;
  } catch(error) {
    if(error?.name==='PasswordException')throw new Error('Este PDF tem senha. Importe uma cópia desbloqueada.');
    throw new Error(error?.message || 'Não foi possível importar o PDF.');
  } finally {await task.destroy();}
}

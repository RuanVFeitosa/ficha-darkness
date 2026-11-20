import {importStoryPdf,pdfPageText} from './storyPdf';
const mockDestroy=jest.fn(),mockCleanup=jest.fn();
const mockGetPage=jest.fn();
jest.mock('pdfjs-dist/build/pdf.mjs',()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:mockGetPage}),destroy:mockDestroy})}));

test('extrai texto mantendo linhas e ignora itens sem texto',()=>{
 expect(pdfPageText([{str:'Primeira',transform:[0,0,0,0,0,100]},{str:'linha',hasEOL:true,transform:[0,0,0,0,0,100]},{str:'Segunda',transform:[0,0,0,0,0,80]},{}])).toBe('Primeira linha\nSegunda');
});

test('renderiza cada página do PDF em ordem e limpa recursos',async()=>{
 mockGetPage.mockImplementation(async number=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:()=>({promise:Promise.resolve()}),getTextContent:async()=>({items:[{str:`Página ${number}`}]}),cleanup:mockCleanup}));
 const context=jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({});
 const image=jest.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/webp;base64,cGFnZQ==');
 try{
  const progress=jest.fn();
  const pages=await importStoryPdf({name:'historia.pdf',size:100,type:'application/pdf',arrayBuffer:async()=>new ArrayBuffer(8)},progress);
  expect(pages.map(page=>page.sourcePage)).toEqual([1,2]);
  expect(pages[1].text).toBe('Página 2');
  expect(progress).toHaveBeenLastCalledWith(2,2);
  expect(mockCleanup).toHaveBeenCalledTimes(2);
  expect(mockDestroy).toHaveBeenCalled();
 }finally{context.mockRestore();image.mockRestore();}
});

test('recusa arquivos que não são PDF sem alterar conteúdo',async()=>{
 await expect(importStoryPdf({name:'historia.txt',type:'text/plain'})).rejects.toThrow('Escolha um arquivo PDF');
});

import {specialSceneMediaType,specialSceneMime} from './specialSceneMedia';
import {validarArquivoImagem,enviarImagemCena} from '../services/mesaApi';
test.each([
 ['animacao.gif','image/gif'],['foto.jpg','image/jpeg'],['cena.png','image/png'],
 ['cena.apng','image/apng'],['cena.avif','image/avif'],['cena.webp','image/webp'],
 ['cena.bmp','image/bmp'],['cena.ico','image/x-icon'],
])('aceita %s sem MIME informado pelo navegador', (name,mime)=>{
 const file=new File(['original'],name,{type:''});
 expect(specialSceneMime(file)).toBe(mime);
 expect(validarArquivoImagem(file,'especial')).toBe(file);
 expect(specialSceneMediaType({file,fallback:'video'})).toBe('imagem');
});
test('substituir vídeo por GIF ou imagem redefine o tipo, inclusive em URLs',()=>{
 expect(specialSceneMediaType({file:new File(['gif'],'opening.gif',{type:'image/gif'}),fallback:'video'})).toBe('imagem');
 expect(specialSceneMediaType({url:'https://host/opening.gif?token=x',fallback:'video'})).toBe('imagem');
 expect(specialSceneMediaType({url:'https://host/opening.webm?token=x'})).toBe('video');
 expect(specialSceneMediaType({url:'blob:video',fallback:'video'})).toBe('video');
});
test('preserva os bytes e o tipo de GIF no upload local',async()=>{
 const file=new File(['GIF89a-original'],'intro.gif');
 const url=await enviarImagemCena('demo',file,'especial');
 expect(url).toBe('data:image/gif;base64,R0lGODlhLW9yaWdpbmFs');
});
test('mantém limite e rejeita formatos incompatíveis',()=>{
 expect(()=>validarArquivoImagem({name:'x.gif',type:'image/gif',size:26*1024*1024},'especial')).toThrow('25 MB');
 expect(()=>validarArquivoImagem(new File(['x'],'x.html',{type:'text/html'}),'especial')).toThrow('Formato');
});

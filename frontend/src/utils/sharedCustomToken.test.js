import {sharedCustomToken} from './sharedCustomToken';
test('pista textual transmite conteúdo e posição sem exigir upload da imagem',()=>{
 const clue={id:'uv',uvOnly:true,uvText:'A verdade será contada',image:'data:image/png;base64,abc',x:3,z:4,elevation:1.5,scale:2};
 expect(sharedCustomToken(clue)).toEqual({...clue,image:''});
 expect(clue.image).toBe('data:image/png;base64,abc');
 const image={id:'image',image:'/mark.png',uvOnly:true};
 expect(sharedCustomToken(image)).toBe(image);
});

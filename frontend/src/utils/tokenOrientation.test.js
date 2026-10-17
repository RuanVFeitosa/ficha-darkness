import { rotacaoToken } from "./tokenOrientation";
test("a rotação manual permanece fixa ao mudar a câmera", () => {
 expect(rotacaoToken(90,false,[1,0],[0,0])).toBeCloseTo(Math.PI/2);
 expect(rotacaoToken(90,false,[-1,0],[0,0])).toBeCloseTo(Math.PI/2);
});
test("o modo automático acompanha a câmera", () => {
 expect(rotacaoToken(0,true,[1,0],[0,0])).toBeCloseTo(Math.PI/2);
 expect(rotacaoToken(0,true,[-1,0],[0,0])).toBeCloseTo(-Math.PI/2);
});
test("tokens antigos continuam acompanhando a câmera", () => {
 expect(rotacaoToken(undefined,undefined,[1,0],[0,0])).toBeCloseTo(Math.PI/2);
});

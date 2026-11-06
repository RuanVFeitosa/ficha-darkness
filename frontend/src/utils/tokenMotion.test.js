import { suavizarPosicaoToken,suavizarPoseToken } from "./tokenMotion";
test("interpola sem saltar ou ultrapassar a posição recebida", () => {
 const next=suavizarPosicaoToken([0,0],[1,2],1/60);
 expect(next[0]).toBeGreaterThan(0);expect(next[0]).toBeLessThan(1);
 expect(next[1]).toBeGreaterThan(0);expect(next[1]).toBeLessThan(2);
});
test("mantém a velocidade da animação em taxas de quadros diferentes", () => {
 const slow=suavizarPosicaoToken([0,0],[1,0],1/30);
 const first=suavizarPosicaoToken([0,0],[1,0],1/60);
 const fast=suavizarPosicaoToken(first,[1,0],1/60);
 expect(fast[0]).toBeCloseTo(slow[0],8);
});
test("teletransportes grandes e chegada final não deixam o token flutuando", () => {
 expect(suavizarPosicaoToken([0,0],[20,0],1/60)).toEqual([20,0]);
 expect(suavizarPosicaoToken([0.9999,0],[1,0],1/60)).toEqual([1,0]);
});

test('subir degraus interpola a altura sem reiniciar a posição horizontal',()=>{
 let current=[2,0,3];
 for(let i=0;i<60;i+=1) {
   const next=suavizarPoseToken(current,[3,0.12,4],1/60);
   expect(next[0]).toBeGreaterThanOrEqual(current[0]);
   expect(next[1]).toBeGreaterThanOrEqual(current[1]);
   expect(next[2]).toBeGreaterThanOrEqual(current[2]);
   current=next;
 }
 expect(current).toEqual([3,0.12,4]);
});

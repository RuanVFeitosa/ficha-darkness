import {canMoveTacticalToken} from './tabletopCharacters';

test('jogador move somente o personagem vinculado à própria ficha',()=>{
 expect(canMoveTacticalToken({id:'espiral:123',personIndex:0},false,'espiral:123')).toBe(true);
 expect(canMoveTacticalToken({id:'espiral:456',personIndex:1},false,'espiral:123')).toBe(false);
 expect(canMoveTacticalToken({id:'npc'},false,'espiral:123')).toBe(false);
 expect(canMoveTacticalToken({id:'espiral:123'},false,'espiral:123')).toBe(false);
 expect(canMoveTacticalToken({id:'espiral:123',personIndex:0},false,null)).toBe(false);
});
test('mestre continua podendo mover qualquer token',()=>{
 expect(canMoveTacticalToken({id:'npc'},true,null)).toBe(true);
 expect(canMoveTacticalToken({id:'espiral:123',personIndex:0},true,null)).toBe(true);
});

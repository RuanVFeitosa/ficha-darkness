import { pageTransitionSystem } from './pageTransitionSystem';
beforeEach(() => localStorage.clear());
test('navegação do mestre segue o sistema selecionado mesmo sem sistema na URL', () => {
 localStorage.setItem('darkness_dashboard_sistema','espiral');
 expect(pageTransitionSystem('?mestre=1')).toBe('espiral');
 expect(pageTransitionSystem('?campanha=ABC&papel=mestre&tabletop3d=1')).toBe('espiral');
 expect(pageTransitionSystem('?criarMapa3d=1')).toBe('espiral');
});
test('sistema explícito prevalece e páginas de jogador não herdam escolha do mestre', () => {
 localStorage.setItem('darkness_dashboard_sistema','espiral');
 expect(pageTransitionSystem('?mestre=1&sistema=darkness')).toBe('darkness');
 expect(pageTransitionSystem('?sistema=espiral&ficha=ana')).toBe('espiral');
 expect(pageTransitionSystem('?ficha=ana')).toBe('darkness');
});
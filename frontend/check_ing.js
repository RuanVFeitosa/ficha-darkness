const receitas = require('./src/components/data/receitasCriacao.js').receitasCriacao;
const normalizarIngrediente = (nome) => String(nome)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\d+x\s*/g, '')
  .trim();
const mapa = {
  alcool: 'alcool',
  trapos: 'trapos',
  recipiente: 'recipiente',
  explosivos: 'explosivos',
  explosivo: 'explosivos',
  fita: 'fita',
  'fita adesiva': 'fita',
  lamina: 'laminas',
  laminas: 'laminas',
  pregos: 'pregos',
  'pedaco de madeira': 'madeira',
  madeira: 'madeira',
  'pedaco de cano': 'cano',
  'cano quebrado': 'cano',
  cano: 'cano',
  faca: 'faca',
};
const missing = new Set();
for (const grupo of receitas) {
  for (const receita of grupo.itens) {
    const ingredientes = receita.ingredientes || [];
    ingredientes.forEach((ingrediente) => {
      const nome = typeof ingrediente === 'string' ? ingrediente : ingrediente.nome;
      const chave = normalizarIngrediente(nome);
      if (!mapa[chave]) missing.add(chave);
    });
  }
}
console.log([...missing].sort());

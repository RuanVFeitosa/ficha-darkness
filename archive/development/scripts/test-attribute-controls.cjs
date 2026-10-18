const fs=require('fs');let p='frontend/src/pages/fichaEspiral.jsx',s=fs.readFileSync(p,'utf8');const a=s.indexOf('  function changeAttribute('),b=s.indexOf('  const updateEquipment',a);s=s.slice(0,a)+s.slice(b);fs.writeFileSync(p,s);
p='frontend/src/pages/fichaEspiral.test.jsx';s=fs.readFileSync(p,'utf8');const start=s.indexOf("test('preserva dano"),end=s.indexOf("test('rolagem consome",start);s=s.slice(0,start)+`test('categoria permanente fica bloqueada e aumento temporário não altera a ficha', () => {
 const view=render(<FichaEspiral/>);
 expect(screen.queryByLabelText('Estágio de Pulso')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Aumentar categoria temporária de Pulso'}));
 expect(screen.getByText('Temporário · próxima rolagem')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Rolar somente Pulso'}));
 const dialog=screen.getByRole('dialog',{name:'Resultado da rolagem'});
 expect(within(dialog).getByText('Pulso · somente atributo')).toBeInTheDocument();
 expect(screen.queryByText('Temporário · próxima rolagem')).toBeNull();
 expect(JSON.parse(localStorage.getItem('espiral:sheet:v1:principal')).attributes.pulso).toBe(2);
 view.unmount();
});

`+s.slice(end);fs.writeFileSync(p,s);

import {arvoresHabilidades,salvarArvoresCustom,obterTodasArvores} from './arvoresHabilidades';
import {normalizarConteudoAbsoluto} from '../../utils/absolutoModificadores';
import {balancearTrilhaEspecialidade} from '../especialidadesBalanceamento';
afterEach(()=>salvarArvoresCustom({}));
test('descrição, custo e nome editados sobrevivem ao salvamento e releitura de absolutas, aptidões e especialidades',()=>{
 const original=arvoresHabilidades.aniquilador;
 const edited=ability=>({...ability,nome:'Nome do mestre',descricao:'Descrição escrita pelo mestre: +3 dados.',custo:'7 PE',editadoPeloMestre:true});
 const tree={...original,absolutas:[edited(original.absolutas[0])],aptidoes:[edited(original.aptidoes.find(item=>item.balanceamentoPassiva))],especialidades:[{...original.especialidades[0],habilidades:[edited(original.especialidades[0].habilidades[0])]}]};
 salvarArvoresCustom({aniquilador:tree});
 const loaded=obterTodasArvores().aniquilador;
 for(const ability of [loaded.absolutas[0],loaded.aptidoes[0],loaded.especialidades[0].habilidades[0]]){
  expect(ability).toMatchObject({nome:'Nome do mestre',descricao:'Descrição escrita pelo mestre: +3 dados.',custo:'7 PE',editadoPeloMestre:true});
 }
 const fromStorage=JSON.parse(localStorage.getItem('arvoresHabilidades_custom'));
 salvarArvoresCustom(JSON.parse(JSON.stringify(fromStorage)));
 expect(obterTodasArvores().aniquilador.absolutas[0]).toEqual(loaded.absolutas[0]);
 expect(obterTodasArvores().especialista).toEqual(arvoresHabilidades.especialista);
});
test('a passiva da especialidade marcada como editada não é reconstruída a partir do texto original',()=>{
 const specialty={id:'test',passiva:'Passiva do mestre.',passivaEspecialidadeOriginal:'Texto antigo.',editadoPeloMestre:true,habilidades:[]};
 expect(balancearTrilhaEspecialidade(normalizarConteudoAbsoluto(specialty))).toEqual(specialty);
});

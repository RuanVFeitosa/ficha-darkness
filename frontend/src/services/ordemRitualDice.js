// Fórmulas de dano e cura do Livro Base v1.3, por versão Normal, Discente e Verdadeiro.
// Um par [fórmula, efeito] distingue rolagens para situações diferentes na mesma versão.
const formulas = {
  'Amaldiçoar Arma': [['1d6'], ['2d6'], ['4d6']],
  'Chamas do Caos': [[['1d6', 'Chamejar'], ['1d6', 'Esquentar'], ['3d6', 'Modelar']], ['4d6'], ['8d6']],
  Cicatrização: [[['3d8+3', 'Cura']], [['5d8+5', 'Cura']], [['7d8+7', 'Cura']]],
  'Conhecendo o Medo': [[['10d6', 'Dano mental se resistir']]],
  'Consumir Manancial': [[], [], ['3d6']],
  'Contenção Fantasmagórica': [[], [], ['2d6+2']],
  'Convocar o Algoz': [[['6d6', 'Dano se resistir']]],
  Decadência: [['2d8+2'], ['3d8+3'], ['8d8+8']],
  'Deflagração de Energia': [['3d10×10'], [], ['3d10×10']],
  Descarnar: [[['6d8', 'Dano direto'], ['2d8', 'Hemorragia']], [['10d8', 'Dano direto'], ['4d8', 'Hemorragia']], [['4d8', 'Dano adicional']]],
  Eletrocussão: [['3d6'], ['6d6'], ['8d6']],
  'Ferver Sangue': [['4d8'], [], ['4d8']],
  'Flagelo de Sangue': [['10d6'], ['10d6'], ['10d6']],
  Hemofagia: [['6d6'], ['6d6'], ['4d6']],
  Inexistir: [[['10d12+10', 'Dano direto'], ['2d12', 'Dano se resistir']], [['15d12+15', 'Dano direto'], ['3d12', 'Dano se resistir']], [['20d12+20', 'Dano direto'], ['4d12', 'Dano se resistir']]],
  'Invadir Mente': [[['6d6', 'Rajada mental']], [['10d6', 'Rajada mental']], [['10d6', 'Rajada mental']]],
  'Lâmina do Medo': [[['10d8', 'Dano se resistir']]],
  'Miasma Entrópico': [['4d8'], ['6d8'], ['6d8']],
  Paradoxo: [['6d6'], ['4d6'], ['13d6']],
  Perturbação: [[], ['3d8']],
  'Poeira da Podridão': [['4d8'], [], ['4d8+16']],
  'Polarização Caótica': [[], [['1d6', 'Por espaço nos projéteis'], ['1d6', 'Por 3 m de impacto']]],
  'Presença do Medo': [[['5d8', 'Dano mental'], ['5d8', 'Dano de Medo']]],
  Purgatório: [['6d6']],
  'Tecer Ilusão': [[], [], ['6d6']],
  'Tentáculos de Lodo': [['4d6'], ['4d6'], ['6d6']],
  'Transfigurar Água': [[['5d8', 'Evaporar']], [], [['10d8', 'Evaporar']]],
  'Transfigurar Terra': [[['10d6', 'Desabamento']], [['10d6', 'Desabamento']], [['10d6', 'Desabamento']]],
  'Vomitar Pestes': [['5d12'], ['5d12'], ['5d12']],
};

export function ritualRolls(name, version) {
  const key = name.startsWith('Amaldiçoar Arma (') ? 'Amaldiçoar Arma' : name;
  return (formulas[key]?.[version] ?? []).map(roll =>
    Array.isArray(roll) ? { expression: roll[0], effect: roll[1] } : { expression: roll, effect: '' });
}

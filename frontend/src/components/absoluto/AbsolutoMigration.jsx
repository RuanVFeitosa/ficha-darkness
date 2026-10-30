import React, { useState } from 'react';
import { proporMigracaoV1 } from '../../data/absolutoV1';
import { AbsolutoValores } from './AbsolutoValores';

export default function AbsolutoMigration({ personagem, onApply }) {
  const [proposta, setProposta] = useState(null);
  return <section className="abs-v1 abs-v1-migration"><span className="abs-v1-kicker">PROTOCOLO ABSOLUTO 1.0</span><h2>Uma nova existência</h2><p>Adapte esta ficha para os nove Domínios, testes por Êxitos e oito regiões de Integridade. Revise os valores antes de aplicar. A ficha anterior será preservada no arquivo da personagem.</p>
    {!proposta ? <button type="button" onClick={() => setProposta(proporMigracaoV1(personagem))}>Preparar adaptação para 1.0</button> : <><p>Proposta inicial: os modificadores da antiga escala de Atributos tornam-se valores de 0 a 5. Firmeza → Mobilidade; Carisma → Influência; Persistência → Determinação; Resistência → Vigor. Precisão começa em zero. Os antigos Passivos não são convertidos em bônus.</p><AbsolutoValores personagem={proposta} onChange={setProposta} /><p>Os recursos serão recalculados. Revise com o Narrador o histórico de ferimentos, sacrifícios e benefícios permanentes.</p><div className="abs-v1-actions"><button type="button" onClick={() => onApply(proposta)}>Aplicar versão 1.0 e preservar original</button><button type="button" onClick={() => setProposta(null)}>Cancelar adaptação</button></div></>}
  </section>;
}

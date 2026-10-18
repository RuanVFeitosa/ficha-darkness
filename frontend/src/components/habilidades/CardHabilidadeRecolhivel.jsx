import {useAbilityReading} from './AbilityReadingLayout';
import AbilityDocument from './AbilityDocument';
import React, {useState} from 'react';
const CardHabilidadeRecolhivel = ({
    habilidade,
    tipo = "APTIDÃO",
    classeExtra = "",
    selo,
    acao,
    onEditar,
  }) => {
    const [aberto, setAberto] = useState(classeExtra.includes("arquetipo"));

    const reading=useAbilityReading();
    const descricaoId = React.useId();
    const descricao =
      habilidade.descricao ||
      habilidade.habilidadePrincipal ||
      habilidade.detalhes ||
      "Descrição não disponível.";

    return (
      <article
        className={`habilidade-expandivel ${classeExtra} ${aberto ? "aberto" : ""}`}
      >
        <div className="habilidade-expandivel-cabecalho">
          <button
            type="button"
            className="habilidade-expandivel-topo"
            onClick={() => setAberto((prev) => !prev)}
            aria-expanded={aberto}
            aria-controls={descricaoId}
          >
            <div>
              <span>{tipo}</span>
              <h3>{habilidade.nome}</h3>
            </div>

            <span className="abs-skill-chevron" aria-hidden="true">⌄</span>
            {(selo || habilidade.custo) && <strong>{selo || habilidade.custo}</strong>}
          </button>
          {reading && classeExtra.split(/\s+/).includes("criada") && <button type="button" className="habilidade-leitura-abrir" aria-label={'Ampliar habilidade '+habilidade.nome} title="Ler ao lado da ficha" onClick={()=>reading.open({...habilidade,descricao},tipo,selo)}>⛶ <span>Ampliar</span></button>}
          {onEditar && <button type="button" className="habilidade-editar" disabled={habilidade.status!=='aprovada' || Boolean(habilidade.edicaoPendente)} onClick={onEditar} title={habilidade.edicaoPendente?'Aguarde a análise do mestre':'Solicitar edição ao mestre'}>Editar</button>}
          {acao && (
            <button
              type="button"
              className="habilidade-expandivel-acao"
              onClick={acao.onClick}
            >
              {acao.rotulo}
            </button>
          )}
        </div>

        {habilidade.edicaoPendente && <p className="ability-edit-pending">Edição aguardando aprovação do mestre. Versão atual mantida.</p>}
        {!habilidade.edicaoPendente && habilidade.ultimaEdicao && <p className="ability-edit-pending">Última edição {habilidade.ultimaEdicao.status=== 'aprovada'?'aprovada':'recusada pelo mestre'}.</p>}
        <div id={descricaoId} className="habilidade-expandivel-corpo" aria-hidden={!aberto}>
          <AbilityDocument habilidade={{...habilidade,descricao}}/>
        </div>
      </article>
    );
  };
export default CardHabilidadeRecolhivel;

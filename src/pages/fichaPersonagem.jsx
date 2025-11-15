// src/components/FichaPersonagem.jsx
import React, { useState, useEffect } from 'react';
import '../CSS/FichaPersonagem.css';
import profile from '../assets/IMG/perfil_template.jpg';
import corpoHumano from '../assets/IMG/corpo_humano.png';
import { descricoesHabilidades } from '../components/descricoesHabilidades';
import ModalDescricao from '../components/modal/modalDescricao';

// Chave para o localStorage
const STORAGE_KEY = 'fichaRPG_personagem';

// Estado inicial padrão
const estadoInicial = {
  nome: '',
  atributos: {
    forca: 0,
    fonitude: 0,
    inteligencia: 0,
    reflexos: 0,
    vontade: 0
  },
  vida: { atual: 0, max: 0 },
  sanidade: { atual: 50, max: 100 },
  esperanca: { atual: 30, max: 60 },
  membros: {
    cabeca: { atual: 10, max: 10, ferido: false },
    torso: { atual: 20, max: 20, ferido: false },
    bracoDireito: { atual: 8, max: 8, ferido: false },
    bracoEsquerdo: { atual: 8, max: 8, ferido: false },
    pernaDireita: { atual: 12, max: 12, ferido: false },
    pernaEsquerda: { atual: 12, max: 12, ferido: false }
  },
  habilidadesCombate: {
    razao: 0,
    firmeza: 0,
    intuicao: 0,
    violencia: 0,
    percepcao: 0,
    carisma: 0
  },
  habilidadesPassivas: {
    // Sociais & Mentais
    enganacao: 0,
    raciocinioLogico: 0,
    investigacao: 0,
    sensibilidade: 0,
    instintoSobrevivencia: 0,
    coragem: 0,
    diplomacia: 0,
    disciplina: 0,
    autocontrole: 0,
    intimidacaoPassiva: 0,
    presenca: 0,
    memoria: 0,
    empatia: 0,
    lealdade: 0,
    fe: 0,
    // Físicas
    vitalidade: 0,
    folego: 0,
    equilibrio: 0,
    velocidade: 0,
    precisao: 0,
    resistenciaFisica: 0,
    // Conhecimentos
    conhecimentoMedico: 0,
    conhecimentoTecnico: 0,
    conhecimentoHistorico: 0,
    conhecimentoOculto: 0,
    // Percepções
    percepcaoAuditiva: 0,
    percepcaoVisual: 0,
    percepcaoOlfativa: 0,
    // Resistências
    resistenciaMental: 0
  },
  rituais: [
    { nome: 'Ritual da Protecao', custo: '3 PE' },
    { nome: 'Invocaçao Menor', custo: '5 PE' }
  ],
  inventario: [
    { nome: 'Pistola (9mm)', detalhes: '12 balas' },
    { nome: 'Kit Primeiros Socorros', detalhes: '3 usos' },
    { nome: 'Lanterna', detalhes: 'Bateria fraca' }
  ],
  descricao: ''
};

const FichaPersonagem = () => {
    const [personagem, setPersonagem] = useState(estadoInicial);
  const [abaAtiva, setAbaAtiva] = useState('combate');
  const [ultimoSave, setUltimoSave] = useState(null);
  const [carregado, setCarregado] = useState(false);
  
  // ESTADO PARA O MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalDescricao, setModalDescricao] = useState('');

  // FUNÇÃO PARA ABRIR MODAL
  const abrirModal = (titulo, chaveHabilidade) => {
    setModalTitulo(titulo);
    setModalDescricao(descricoesHabilidades[chaveHabilidade] || 'Descrição não disponível.');
    setModalAberto(true);
  };

  // FUNÇÃO PARA FECHAR MODAL
  const fecharModal = () => {
    setModalAberto(false);
  };

  // CARREGAR DADOS AO INICIAR
  useEffect(() => {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos) {
      try {
        const personagemSalvo = JSON.parse(dadosSalvos);
        setPersonagem(personagemSalvo);
        console.log('✅ Dados carregados do salvamento anterior');
      } catch (error) {
        console.error('❌ Erro ao carregar dados salvos:', error);
      }
    }
  }, []);

  // SALVAR DADOS AUTOMATICAMENTE QUANDO MUDAR
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personagem));
    setUltimoSave(new Date().toLocaleTimeString());
  }, [personagem]);

  // FUNÇÃO PARA LIMPAR TODOS OS DADOS
  const limparFicha = () => {
    if (window.confirm('Tem certeza que deseja limpar toda a ficha? Esta ação não pode ser desfeita!')) {
      localStorage.removeItem(STORAGE_KEY);
      setPersonagem(estadoInicial);
      setUltimoSave(null);
      alert('Ficha limpa com sucesso!');
    }
  };

  // FUNÇÃO PARA EXPORTAR DADOS
  const exportarFicha = () => {
    const dados = JSON.stringify(personagem, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-personagem-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // FUNÇÃO PARA IMPORTAR DADOS
  const importarFicha = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dados = JSON.parse(e.target.result);
          setPersonagem(dados);
          alert('Ficha importada com sucesso!');
        } catch (error) {
          alert('Erro ao importar ficha. Verifique o arquivo.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // FUNÇÕES DE ATUALIZAÇÃO
  const atualizarAtributo = (atributo, valor) => {
    setPersonagem(prev => ({
      ...prev,
      atributos: {
        ...prev.atributos,
        [atributo]: parseInt(valor) || 0
      }
    }));
  };

  const atualizarSanidade = (novaSanidade) => {
    setPersonagem(prev => ({
      ...prev,
      sanidade: {
        ...prev.sanidade,
        atual: Math.max(0, Math.min(prev.sanidade.max, parseInt(novaSanidade) || 0))
      }
    }));
  };

  const atualizarEsperanca = (novaEsperanca) => {
    setPersonagem(prev => ({
      ...prev,
      esperanca: {
        ...prev.esperanca,
        atual: Math.max(0, Math.min(prev.esperanca.max, parseInt(novaEsperanca) || 0))
      }
    }));
  };

  const atualizarVidaMembro = (membro, novoValor) => {
    setPersonagem(prev => ({
      ...prev,
      membros: {
        ...prev.membros,
        [membro]: {
          ...prev.membros[membro],
          atual: Math.max(0, Math.min(prev.membros[membro].max, parseInt(novoValor) || 0)),
          ferido: parseInt(novoValor) < prev.membros[membro].max
        }
      }
    }));
  };

  const atualizarHabilidadeCombate = (habilidade, valor) => {
    setPersonagem(prev => ({
      ...prev,
      habilidadesCombate: {
        ...prev.habilidadesCombate,
        [habilidade]: parseInt(valor) || 0
      }
    }));
  };

  const atualizarHabilidadePassiva = (habilidade, valor) => {
    setPersonagem(prev => ({
      ...prev,
      habilidadesPassivas: {
        ...prev.habilidadesPassivas,
        [habilidade]: Math.max(0, Math.min(100, parseInt(valor) || 0))
      }
    }));
  };

  const atualizarDescricao = (novaDescricao) => {
    setPersonagem(prev => ({
      ...prev,
      descricao: novaDescricao
    }));
  };

  // Calcular vida total baseada nos membros
  const vidaTotal = {
    atual: Object.values(personagem.membros).reduce((acc, m) => acc + m.atual, 0),
    max: Object.values(personagem.membros).reduce((acc, m) => acc + m.max, 0)
  };

  // Componente para cada habilidade passiva
 const HabilidadeCombate = ({ nome, chave }) => {
    const valor = personagem.habilidadesCombate[chave] || 0;

    return (
      <div className="habilidade-item">
        <span 
          className="habilidade-nome clickable"
          onClick={() => abrirModal(nome, chave)}
          title="Clique para ver descrição"
        >
          {nome}
        </span>
        <div className="habilidade-controles">
          <input
            type="number"
            value={valor}
            onChange={(e) => atualizarHabilidadeCombate(chave, e.target.value)}
            className="habilidade-valor"
            min="0"
            max="100"
          />
          <div className="passiva-botoes">
            <button onClick={() => atualizarHabilidadeCombate(chave, Math.max(0, valor - 1))}>-</button>
            <button onClick={() => atualizarHabilidadeCombate(chave, Math.min(100, valor + 1))}>+</button>
          </div>
        </div>
      </div>
    );
  };

  const HabilidadePassiva = ({ nome, chave }) => {
    const valor = personagem.habilidadesPassivas[chave] || 0;

    return (
      <div className="habilidade-passiva-item">
        <span 
          className="passiva-nome clickable"
          onClick={() => abrirModal(nome, chave)}
          title="Clique para ver descrição"
        >
          {nome}
        </span>
        <div className="passiva-controles">
          <input
            type="number"
            value={valor}
            onChange={(e) => atualizarHabilidadePassiva(chave, e.target.value)}
            className="passiva-valor"
            min="0"
            max="100"
          />
          <div className="passiva-botoes">
            <button onClick={() => atualizarHabilidadePassiva(chave, Math.max(0, valor - 1))}>-</button>
            <button onClick={() => atualizarHabilidadePassiva(chave, Math.min(100, valor + 1))}>+</button>
          </div>
        </div>
      </div>
    );
  };

  

  // Conteúdo das abas
  const conteudoAbas = {
    combate: (
       <div className="conteudo-aba">
        <h4>HABILIDADES DE COMBATE</h4>
        <div className="lista-habilidades">
          <HabilidadeCombate nome="Razão" chave="razao" />
          <HabilidadeCombate nome="Firmeza" chave="firmeza" />
          <HabilidadeCombate nome="Intuição" chave="intuicao" />
          <HabilidadeCombate nome="Violencia" chave="violencia" />
          <HabilidadeCombate nome="Percepção" chave="percepcao" />
          <HabilidadeCombate nome="Carisma" chave="carisma" />
        </div>
      </div>
    ),

    passivas: (
      <div className="conteudo-aba passiva-aba">
        <div className="categorias-passivas">
          {/* CATEGORIA 1: Habilidades Sociais e Mentais */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">SOCIAIS & MENTAIS</h5>
            <div className="lista-passivas">
              <HabilidadePassiva nome="Enganação" chave="enganacao" />
              <HabilidadePassiva nome="Raciocínio Lógico" chave="raciocinioLogico" />
              <HabilidadePassiva nome="Investigação" chave="investigacao" />
              <HabilidadePassiva nome="Sensibilidade" chave="sensibilidade" />
              <HabilidadePassiva nome="Instinto de Sobrevivência" chave="instintoSobrevivencia" />
              <HabilidadePassiva nome="Coragem" chave="coragem" />
              <HabilidadePassiva nome="Diplomacia" chave="diplomacia" />
              <HabilidadePassiva nome="Disciplina" chave="disciplina" />
              <HabilidadePassiva nome="Autocontrole" chave="autocontrole" />
              <HabilidadePassiva nome="Intimidação Passiva" chave="intimidacaoPassiva" />
              <HabilidadePassiva nome="Presença" chave="presenca" />
              <HabilidadePassiva nome="Memória" chave="memoria" />
              <HabilidadePassiva nome="Empatia" chave="empatia" />
              <HabilidadePassiva nome="Lealdade" chave="lealdade" />
              <HabilidadePassiva nome="Fé" chave="fe" />
            </div>
          </div>

          {/* CATEGORIA 2: Habilidades Físicas */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">FÍSICAS</h5>
            <div className="lista-passivas">
              <HabilidadePassiva nome="Vitalidade" chave="vitalidade" />
              <HabilidadePassiva nome="Fôlego" chave="folego" />
              <HabilidadePassiva nome="Equilíbrio" chave="equilibrio" />
              <HabilidadePassiva nome="Velocidade" chave="velocidade" />
              <HabilidadePassiva nome="Precisão" chave="precisao" />
              <HabilidadePassiva nome="Resistência Física" chave="resistenciaFisica" />
            </div>
          </div>

          {/* CATEGORIA 3: Conhecimentos */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">CONHECIMENTOS</h5>
            <div className="lista-passivas">
              <HabilidadePassiva nome="Conhecimento Médico" chave="conhecimentoMedico" />
              <HabilidadePassiva nome="Conhecimento Técnico" chave="conhecimentoTecnico" />
              <HabilidadePassiva nome="Conhecimento Histórico" chave="conhecimentoHistorico" />
              <HabilidadePassiva nome="Conhecimento Oculto" chave="conhecimentoOculto" />
            </div>
          </div>

          {/* CATEGORIA 4: Percepções */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">PERCEPÇÕES</h5>
            <div className="lista-passivas">
              <HabilidadePassiva nome="Percepção Auditiva" chave="percepcaoAuditiva" />
              <HabilidadePassiva nome="Percepção Visual" chave="percepcaoVisual" />
              <HabilidadePassiva nome="Percepção Olfativa" chave="percepcaoOlfativa" />
            </div>
          </div>

          {/* CATEGORIA 5: Resistências */}
          <div className="categoria-passiva">
            <h5 className="categoria-titulo">RESISTÊNCIAS</h5>
            <div className="lista-passivas">
              <HabilidadePassiva nome="Resistência Mental" chave="resistenciaMental" />
            </div>
          </div>
        </div>
      </div>
    ),

    rituais: (
      <div className="conteudo-aba">
        <h4>RITUAIS CONHECIDOS</h4>
        <div className="lista-rituais">
          {personagem.rituais.map((ritual, index) => (
            <div key={index} className="ritual-item">
              <span>{ritual.nome}</span>
              <span className="custo-ritual">{ritual.custo}</span>
            </div>
          ))}
        </div>
      </div>
    ),

    inventario: (
      <div className="conteudo-aba">
        <h4>INVENTÁRIO</h4>
        <div className="lista-inventario">
          {personagem.inventario.map((item, index) => (
            <div key={index} className="item-inventario">
              <span>{item.nome}</span>
              <span>{item.detalhes}</span>
            </div>
          ))}
        </div>
      </div>
    ),

    corpo: (
      <div className="conteudo-aba corpo-aba">
        <div className="sistema-membros-sidebar">
          <div className="corpo-container-sidebar">
            <div className="imagem-corpo-sidebar">
              <img src={corpoHumano} alt="Corpo Humano" className="corpo-humano-sidebar" />
              
              {/* Overlays interativos para cada membro */}
              {Object.entries(personagem.membros).map(([membro, dados]) => (
                <div 
                  key={membro}
                  className={`membro-overlay-sidebar ${membro}`}
                  onClick={() => document.querySelector(`.${membro}-input`)?.focus()}
                >
                  <div className={`vida-membro-sidebar ${dados.ferido ? 'ferido' : ''}`}>
                    {dados.atual}
                  </div>
                </div>
              ))}
            </div>

            <div className="controles-membros-sidebar">
              <MembroControle
                nome="CABEÇA"
                membro={personagem.membros.cabeca}
                onChange={(valor) => atualizarVidaMembro('cabeca', valor)}
                classNameInput="cabeca-input"
              />
              <MembroControle
                nome="TORSO"
                membro={personagem.membros.torso}
                onChange={(valor) => atualizarVidaMembro('torso', valor)}
                classNameInput="torso-input"
              />
              <MembroControle
                nome="BRAÇO DIREITO"
                membro={personagem.membros.bracoDireito}
                onChange={(valor) => atualizarVidaMembro('bracoDireito', valor)}
                classNameInput="bracoDireito-input"
              />
              <MembroControle
                nome="BRAÇO ESQUERDO"
                membro={personagem.membros.bracoEsquerdo}
                onChange={(valor) => atualizarVidaMembro('bracoEsquerdo', valor)}
                classNameInput="bracoEsquerdo-input"
              />
              <MembroControle
                nome="PERNA DIREITA"
                membro={personagem.membros.pernaDireita}
                onChange={(valor) => atualizarVidaMembro('pernaDireita', valor)}
                classNameInput="pernaDireita-input"
              />
              <MembroControle
                nome="PERNA ESQUERDA"
                membro={personagem.membros.pernaEsquerda}
                onChange={(valor) => atualizarVidaMembro('pernaEsquerda', valor)}
                classNameInput="pernaEsquerda-input"
              />
            </div>
          </div>

          <div className="vida-total-sidebar">
            <div className="vida-total-info">
              <span className="vida-total-label">VIDA TOTAL:</span>
              <span className="vida-total-valor">
                {vidaTotal.atual} / {vidaTotal.max}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),

    descricao: (
      <div className="conteudo-aba">
        <h4>DESCRIÇÃO & ANOTAÇÕES</h4>
        <textarea
          className="textarea-descricao"
          placeholder="Descreva seu personagem, anotações importantes, história..."
          rows="8"
          value={personagem.descricao}
          onChange={(e) => atualizarDescricao(e.target.value)}
        />
      </div>
    )
  };

  return (
    <div className="ficha-container">
       {/* MODAL */}
      <ModalDescricao 
        isOpen={modalAberto}
        onClose={fecharModal}
        titulo={modalTitulo}
        descricao={modalDescricao}
      />
      {/* BARRA DE CONTROLE DE DADOS */}
      <div className="controles-dados">
        <div className="info-save">
          {ultimoSave && <span>Último save: {ultimoSave}</span>}
        </div>
        <div className="botoes-dados">
          <button onClick={exportarFicha} className="btn-dados exportar">
            📥 Exportar Ficha
          </button>
          <label htmlFor="importar-ficha" className="btn-dados importar">
            📤 Importar Ficha
            <input
              id="importar-ficha"
              type="file"
              accept=".json"
              onChange={importarFicha}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={limparFicha} className="btn-dados limpar">
            🗑️ Limpar Tudo
          </button>
        </div>
      </div>

      {/* Container Principal: Perfil + Atributos + Sidebar */}
      <div className="main-content">
        {/* ... (seu conteúdo existente permanece igual) ... */}
        <div className="profile-section">
          <div className="profile-container">
            {/* Sanidade */}
            <div className="sanidade-section">
              <div className="sanidade-container">
                <div className="sanidade-inputs">
                  <img src={profile} alt="Perfil" className="profile" />
                  <input
                    type="number"
                    value={personagem.sanidade.atual}
                    onChange={(e) => atualizarSanidade(e.target.value)}
                    className="sanidade-atual"
                    min="0"
                    max={personagem.sanidade.max}
                  />
                  <span className="sanidade-separador">/</span>
                  <input
                    type="number"
                    value={personagem.sanidade.max}
                    onChange={(e) => setPersonagem(prev => ({
                      ...prev,
                      sanidade: { ...prev.sanidade, max: parseInt(e.target.value) || 0 }
                    }))}
                    className="sanidade-max"
                    min="0"
                  />
                </div>
                {/* Esperança */}
                <div className="esperanca-section">
                  <div className="esperanca-container">
                    <div className="esperanca-inputs">
                      <input
                        type="number"
                        value={personagem.esperanca.atual}
                        onChange={(e) => atualizarEsperanca(e.target.value)}
                        className="esperanca-atual"
                        min="0"
                        max={personagem.esperanca.max}
                      />
                      <span className="esperanca-separador">/</span>
                      <input
                        type="number"
                        value={personagem.esperanca.max}
                        onChange={(e) => setPersonagem(prev => ({
                          ...prev,
                          esperanca: { ...prev.esperanca, max: parseInt(e.target.value) || 0 }
                        }))}
                        className="esperanca-max"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna do Centro: Atributos em Linha */}
            <div className="atributos-coluna">
              <div className="atributos-linha">
                <Atributo
                  nome="FORÇA"
                  valor={personagem.atributos.forca}
                  onChange={(valor) => atualizarAtributo('forca', valor)}
                />
                <Atributo
                  nome="FORTITUDE"
                  valor={personagem.atributos.fonitude}
                  onChange={(valor) => atualizarAtributo('fonitude', valor)}
                />
                <Atributo
                  nome="INTELIGÊNCIA"
                  valor={personagem.atributos.inteligencia}
                  onChange={(valor) => atualizarAtributo('inteligencia', valor)}
                />
                <Atributo
                  nome="REFLEXOS"
                  valor={personagem.atributos.reflexos}
                  onChange={(valor) => atualizarAtributo('reflexos', valor)}
                />
                <Atributo
                  nome="VONTADE"
                  valor={personagem.atributos.vontade}
                  onChange={(valor) => atualizarAtributo('vontade', valor)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Sidebar com Abas */}
        <div className="sidebar-container">
          <div className="sidebar-abas">
            <button
              className={`aba-btn ${abaAtiva === 'combate' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('combate')}
            >
              Ativas
            </button>
            <button
              className={`aba-btn ${abaAtiva === 'passivas' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('passivas')}
            >
              PASSIVA
            </button>
            <button
              className={`aba-btn ${abaAtiva === 'rituais' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('rituais')}
            >
              RITUAIS
            </button>
            <button
              className={`aba-btn ${abaAtiva === 'inventario' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('inventario')}
            >
              INVENTARIO
            </button>
            <button
              className={`aba-btn ${abaAtiva === 'corpo' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('corpo')}
            >
              CORPO
            </button>
            <button
              className={`aba-btn ${abaAtiva === 'descricao' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('descricao')}
            >
              DESCRICÃO
            </button>
          </div>

          <div className="sidebar-conteudo">
            {conteudoAbas[abaAtiva]}
          </div>
        </div>
      </div>

     
    </div>
  );
};

// Componente de Atributo
const Atributo = ({ nome, valor, onChange }) => {
  return (
    <div className="atributo-item">
      <span className="atributo-nome">{nome}</span>
      <div className="atributo-controles">
        <input
          type="number"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="atributo-valor"
        />
        <div className="atributo-botoes">
          <button onClick={() => onChange(valor - 1)}>-</button>
          <button onClick={() => onChange(valor + 1)}>+</button>
        </div>
      </div>
    </div>
  );
};

// Componente de Barra de Recurso
const BarraRecurso = ({ nome, atual, max, onChange, cor }) => {
  return (
    <div className="barra-recurso">
      <span className="recurso-nome">{nome}</span>
      <div className="recurso-controles">
        <input
          type="number"
          value={atual}
          onChange={(e) => onChange?.(parseInt(e.target.value), max)}
          className="recurso-atual"
        />
        <span>/</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onChange?.(atual, parseInt(e.target.value))}
          className="recurso-max"
        />
      </div>
    </div>
  );
};

// COMPONENTE MembroControle
const MembroControle = ({ nome, membro, onChange, classNameInput }) => {
  return (
    <div className={`membro-controle ${membro.ferido ? 'ferido' : ''}`}>
      <span className="membro-nome">{nome}</span>
      <div className="membro-inputs">
        <input
          type="number"
          value={membro.atual}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={`membro-atual ${classNameInput}`}
          min="0"
          max={membro.max}
        />
        <span>/</span>
        <input
          type="number"
          value={membro.max}
          onChange={(e) => {
            // Lógica para mudar vida máxima do membro
          }}
          className="membro-max"
          min="0"
        />
      </div>
      <div className="membro-botoes">
        <button onClick={() => onChange(membro.atual - 1)}>-</button>
        <button onClick={() => onChange(membro.atual + 1)}>+</button>
      </div>
    </div>
  );
};

export default FichaPersonagem;
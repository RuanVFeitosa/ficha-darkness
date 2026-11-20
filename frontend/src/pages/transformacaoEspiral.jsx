import ProtocolLogo from '../components/ui/ProtocolLogo';
import { darknessAbilityName } from '../utils/darknessAbilityName';
import { buscarFichaEspiral, salvarFichaEspiral } from '../services/espiralApi';
import EspiralDice from '../components/espiral/EspiralDice';
import { espiralDie } from '../utils/espiralDice';
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  mdiArrowLeft,
  mdiLockOutline,
  mdiMinus,
  mdiPlus,
} from "@mdi/js";
import Icon from "@mdi/react";
import { ATTRIBUTES, GRADES, RESOURCES, VERTENTE_HABILIDADES, VERTENTES, freshSheet, normalizarFichaEspiral } from "../data/espiral";
import DarknessTransformationCatalog from '../components/espiral/DarknessTransformationCatalog';
import "../styles/TransformacaoEspiral.css";
import "../styles/TransformationAttributes.css";
import "../styles/TransformationResources.css";

const storageKey = (id) => `espiral:sheet:v1:${id}`;
const loadSheet = (id) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(id)) || "null");
    return saved?.version === 1 ? normalizarFichaEspiral(saved) : freshSheet();
  } catch {
    return freshSheet();
  }
};
const resourceCosts = [0, 1, 2, 3, 4];
const attributeCosts = [0, 0, 3, 4, 5, 6];
const roman = ["0", "I", "II", "III", "IV"];

export default function TransformacaoEspiral() {
  const id =
    new URLSearchParams(window.location.search).get("ficha") || "principal";
  const [sheet, setSheet] = useState(() => loadSheet(id));
  const [activeSection, setActiveSection] = useState("habilidades");
  const [selectedVertente, setSelectedVertente] = useState(sheet.vertente);
  const [notice, setNotice] = useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const busyRef=useRef(false);
  useEffect(() => {
    let active=true;
    buscarFichaEspiral(id).then(remote => {
      if (!active || !remote || localStorage.getItem(`espiral:pending:${id}`)) return;
      setSheet(remote);
      localStorage.setItem(storageKey(id),JSON.stringify(remote));
    }).catch(() => {}).finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[id]);
  const points = Math.max(0, Number(sheet.evolution?.points) || 0);
  const vertenteAbility = VERTENTE_HABILIDADES[sheet.vertente] || VERTENTE_HABILIDADES.Metódica;
  const savedVertente = sheet.evolution?.vertente?.nome;
  const vertenteLevel = savedVertente === sheet.vertente
    ? Math.max(1, Math.min(3, Number(sheet.evolution?.vertente?.nivel) || 1))
    : 1;
  useEffect(() => {
    setSelectedVertente(sheet.vertente);
  }, [sheet.vertente]);
  const characterName = sheet.name || "ARQUIVO SEM IDENTIDADE";
  const save = async (next, message) => {
    if (loading || busyRef.current) return;
    busyRef.current=true;setSaving(true);
    let persisted=false;
    try {
      localStorage.setItem(`espiral:pending:${id}`, '1');
      localStorage.setItem(storageKey(id), JSON.stringify(next));
      persisted=true;
      setSheet(next);
      window.dispatchEvent(new CustomEvent('espiral:sheet-updated',{detail:{id,sheet:next}}));
      setNotice('Salvando avanço…');
      const saved=await salvarFichaEspiral(id,next);
      if (!saved) throw new Error('Não foi possível compartilhar esta ficha.');
      if (localStorage.getItem(storageKey(id))===JSON.stringify(next)) localStorage.removeItem(`espiral:pending:${id}`);
      setNotice(message);
    } catch {
      setNotice(persisted ? 'Avanço salvo neste dispositivo. A sincronização está pendente; a compra e o desconto foram preservados.' : 'Não foi possível salvar o avanço neste dispositivo. Nenhum ponto foi gasto.');
    } finally {busyRef.current=false;setSaving(false);}
  };
  const upgradeResource = (name) => {
    const current = Number(sheet.resources?.[name]) || 0;
    const next = current + 1;
    const cost = resourceCosts[next];
    if (next > 4 || points < cost) return;
    save(
      {
        ...sheet,
        resources: { ...sheet.resources, [name]: next },
        evolution: { ...(sheet.evolution || {}), points: points - cost },
      },
      `${name} avançou para Grau ${roman[next]}.`,
    );
  };
  const downgradeResource = (name) => {
    const current = Math.max(0, Math.min(4, Number(sheet.resources?.[name]) || 0));
    if (current <= 0) return;
    const refund = resourceCosts[current];
    save(
      {
        ...sheet,
        resources: { ...sheet.resources, [name]: current - 1 },
        evolution: { ...(sheet.evolution || {}), points: points + refund },
      },
      `${name} reduzido para Grau ${roman[current - 1]}. Você recebeu ${refund} ${refund === 1 ? "ponto" : "pontos"} de evolução.`,
    );
  };
  const upgradeAttribute = (key) => {
    const current = Number(sheet.attributes?.[key]) || 1;
    const next = current + 1;
    const cost = attributeCosts[next];
    if (next > 5 || points < cost) return;
    save(
      {
        ...sheet,
        attributes: { ...sheet.attributes, [key]: next },
        evolution: { ...(sheet.evolution || {}), points: points - cost },
      },
      `${ATTRIBUTES[key].name} avançou para o Estágio ${next}.`,
    );
  };
  const downgradeAttribute = (key) => {
    const current = Math.max(1, Math.min(5, Number(sheet.attributes?.[key]) || 1));
    if (current <= 1) return;
    const refund = attributeCosts[current];
    save({
      ...sheet,
      attributes: { ...sheet.attributes, [key]: current - 1 },
      evolution: { ...(sheet.evolution || {}), points: points + refund },
    }, `${ATTRIBUTES[key].name} reduzido para o Estágio ${current - 1}. Você recebeu ${refund} pontos de evolução.`);
  };
  const acquireAbility = (ability, abilityCategory) => {
    const id = `${abilityCategory}:${ability[0]}`;
    const current = sheet.evolution?.abilities || [];
    if (points < 3 || current.some((item) => item.id === id)) return;
    save(
      {
        ...sheet,
        evolution: {
          ...(sheet.evolution || {}),
          points: points - 3,
          abilities: [
            ...current,
            { id, name: ability[0], category: abilityCategory, level: 1 },
          ],
        },
      },
      `${darknessAbilityName(ability[0])} foi incorporada ao arquivo.`,
    );
  };
  const upgradeAbility = (id) => {
    const current = sheet.evolution?.abilities || [];
    const ability = current.find((item) => item.id === id);
    if (!ability || ability.level >= 3 || points < 3) return;
    save(
      {
        ...sheet,
        evolution: {
          ...(sheet.evolution || {}),
          points: points - 3,
          abilities: current.map((item) =>
            item.id === id ? { ...item, level: item.level + 1 } : item,
          ),
        },
      },
      `${darknessAbilityName(ability.name)} avançou para o Nível ${ability.level + 1}.`,
    );
  };
  const upgradeVertente = () => {
    if (vertenteLevel >= 3 || points < 3) return;
    const nextLevel = vertenteLevel + 1;
    save(
      {
        ...sheet,
        evolution: {
          ...(sheet.evolution || {}),
          points: points - 3,
          vertente: { nome: sheet.vertente, nivel: nextLevel },
        },
      },
      `${vertenteAbility.nome} avançou para o Nível ${nextLevel}.`,
    );
  };
  const trocarVertente = () => {
    if (!VERTENTES[selectedVertente] || selectedVertente === sheet.vertente) return;
    save(
      {
        ...sheet,
        vertente: selectedVertente,
        evolution: {
          ...(sheet.evolution || {}),
          vertente: { nome: selectedVertente, nivel: 1 },
        },
      },
      `Vertente alterada para ${selectedVertente}. A habilidade começa no Nível 1.`,
    );
  };
  const currentLabel = useMemo(
    () =>
      activeSection === "recursos"
        ? "Evoluindo recursos"
        : activeSection === "atributos"
          ? "Evoluindo atributos"
          : activeSection === "habilidades"
            ? "Novas habilidades"
            : "Vertente",
    [activeSection],
  );
  return (
    <main className="transformacao-page">
      <header className="transformacao-hero">
        <a
          className="transformacao-back"
          href={`?sistema=espiral&ficha=${encodeURIComponent(id)}`}
        >
          <Icon path={mdiArrowLeft} size={0.8} /> Voltar à ficha
        </a>
        <span><ProtocolLogo /> / ARQUIVO DE EVOLUÇÃO</span>
        <h1>Transformação</h1>
        <p>
          Nada atravessa a escuridão sem mudar. Escolha as marcas que ficam.
        </p>
        <div className="transformacao-emblem" aria-hidden="true"><img src="/simbolo-darkness.png" alt=""/><span>EXPERIÊNCIA DEIXA MARCAS.</span></div>
      </header>
      <section className="transformacao-shell">
        <aside className="transformacao-side">
          <span>ARQUIVO ATIVO</span>
          <strong>{characterName}</strong>
          <div />
          <small>PONTOS DE EVOLUÇÃO</small>
          <b>{points}</b>
          <p>Experiência concedida pelo Mestre. Cada escolha deixa uma marca no seu repertório.</p>
          <div className="transformacao-side-summary"><span>REPERTÓRIO</span><strong>{(sheet.evolution?.abilities || []).length} habilidades</strong><span>VERTENTE</span><strong>{sheet.vertente || "Não definida"}</strong></div>
        </aside>
        <section className="transformacao-main">
          <nav
            className="transformacao-tabs"
            aria-label="Áreas de transformação"
          >
            <button
              type="button"
              className={activeSection === "recursos" ? "active" : ""}
              onClick={() => setActiveSection("recursos")}
            >
              01 Recursos
            </button>
            <button
              type="button"
              className={activeSection === "atributos" ? "active" : ""}
              onClick={() => setActiveSection("atributos")}
            >
              02 Atributos
            </button>
            <button
              type="button"
              className={activeSection === "habilidades" ? "active" : ""}
              onClick={() => setActiveSection("habilidades")}
            >
              03 Habilidades
            </button>
            <button
              type="button"
              className={activeSection === "vertente" ? "active" : ""}
              onClick={() => setActiveSection("vertente")}
            >
              04 Vertente
            </button>
          </nav>
          <div className="transformacao-heading">
            <span>{currentLabel.toUpperCase()}</span>
            <p>
              {activeSection === "recursos"
                ? "Recursos representam treino, conhecimento e experiência prática."
                : activeSection === "atributos"
                  ? "Atributos são capacidades amplas e evoluem mais lentamente."
                  : activeSection === "habilidades"
                    ? "Novas habilidades poderão ser escolhidas por 3 Pontos de Evolução."
                    : "A Habilidade de Vertente pode ser aprimorada. A troca de Vertente é narrativa e não consome pontos."}
            </p>
          </div>
          {notice && (
            <p className="transformacao-notice" role="status">
              {notice}
            </p>
          )}
          {activeSection === "recursos" && (
            <section className="dt-resources" aria-label="Evolução de recursos">
              <div className="dt-resources-intro">
                <div><span>PRÁTICA, CONHECIMENTO, SOBREVIVÊNCIA</span><p>Invista experiência para avançar um grau. Cada passo custa mais que o anterior.</p></div>
                <div className="dt-resource-cost-key" aria-label="Custo por grau">
                  {GRADES.slice(1).map((grade, index) => <span key={grade}><b>{roman[index + 1]}</b>{index + 1} {index === 0 ? "ponto" : "pontos"}</span>)}
                </div>
              </div>
              <div className="dt-resource-grid">
              {RESOURCES.map((name, index) => {
                const current = Number(sheet.resources?.[name]) || 0;
                const next = current + 1;
                const cost = resourceCosts[next];
                const maxed = current >= 4;
                const missing = maxed ? 0 : Math.max(0, cost - points);
                return (
                  <article className={`dt-resource-card ${maxed ? "maxed" : ""}`} key={name} aria-label={`${name}: Grau ${roman[current]} ${GRADES[current]}`}>
                    <header><span>RECURSO / {String(index + 1).padStart(2, "0")}</span><span>{maxed ? "DOMINADO" : `GRAU ${roman[current]}`}</span></header>
                    <h2>{name}</h2>
                    <div className="dt-resource-current"><span>GRAU ATUAL</span><strong>{GRADES[current]}</strong></div>
                    <ol className="dt-resource-track" aria-label={`Progressão: grau ${roman[current]} de IV`}>
                      {GRADES.map((grade, gradeIndex) => <li key={grade} className={gradeIndex <= current ? "reached" : ""} aria-current={gradeIndex === current ? "step" : undefined} title={`${roman[gradeIndex]} · ${grade}`}><span/><small>{roman[gradeIndex]}</small></li>)}
                    </ol>
                    <div className="dt-resource-next">
                      {maxed ? <><span>TRAJETÓRIA COMPLETA</span><strong>Domínio alcançado</strong></> : <><span>PRÓXIMO GRAU · {roman[next]}</span><strong>{GRADES[next]}</strong></>}
                    </div>
                    <footer>
                      <div><span>INVESTIMENTO</span><strong>{maxed ? "—" : `${cost} ${cost === 1 ? "PONTO" : "PONTOS"}`}</strong></div>
                      <div className="dt-resource-actions">
                        <button
                          className="dt-resource-upgrade"
                          type="button"
                          disabled={loading || saving || maxed || points < cost}
                          onClick={() => upgradeResource(name)}
                          aria-label={maxed ? `${name}: grau máximo` : `Avançar ${name} para grau ${roman[next]}`}
                        >
                          {maxed ? <Icon path={mdiLockOutline} size={0.75} /> : <Icon path={mdiPlus} size={0.75} />}{" "}
                          {maxed ? "Grau máximo" : "Avançar recurso"}
                        </button>
                        <button
                          className="dt-resource-downgrade"
                          type="button"
                          disabled={loading || saving || current <= 0}
                          onClick={() => downgradeResource(name)}
                          aria-label={current <= 0 ? `${name}: já está no grau mínimo` : `Reduzir ${name} para grau ${roman[current - 1]} e recuperar ${resourceCosts[current]} pontos`}
                        >
                          {current <= 0 ? <Icon path={mdiLockOutline} size={0.7} /> : <Icon path={mdiMinus} size={0.7} />}{" "}
                          {current <= 0 ? "Grau mínimo" : `Reduzir · recuperar ${resourceCosts[current]} ${resourceCosts[current] === 1 ? "ponto" : "pontos"}`}
                        </button>
                      </div>
                      <small>{maxed ? "Este recurso já atingiu o grau máximo." : missing ? `Faltam ${missing} ${missing === 1 ? "ponto" : "pontos"} de evolução.` : "Pontos suficientes para avançar."}</small>
                    </footer>
                  </article>
                );
              })}
              </div>
            </section>
          )}
          {activeSection === "atributos" && (
            <section className="dt-attributes" aria-label="Evolução de atributos">
              <div className="dt-attributes-intro"><span>QUATRO FORMAS DE ENFRENTAR A ESCURIDÃO</span><p>Cada estágio fortalece seu dado de atributo. Veja onde você está e o que muda no próximo passo.</p></div>
              <div className="dt-attribute-grid">
              {Object.entries(ATTRIBUTES).map(([key, attribute], index) => {
                const current = Math.max(1, Math.min(5, Number(sheet.attributes?.[key]) || 1));
                const next = current + 1;
                const cost = attributeCosts[next];
                const maxed = current >= 5;
                const missing = maxed ? 0 : Math.max(0, cost - points);
                return (
                  <article className={`dt-attribute-card ${maxed ? 'maxed' : ''}`} key={key} aria-label={attribute.name}>
                    <header><span>0{index + 1} / ATRIBUTO</span><span>{current} / 5</span></header>
                      <h2>{attribute.name}</h2>
                      <p className="dt-attribute-hint">{attribute.hint}</p>
                    <div className="dt-attribute-current"><div><span>SEU ESTÁGIO</span><strong>{attribute.stages[current - 1]}</strong><small>Estágio {current}</small></div><div className="dt-attribute-die"><EspiralDice value={espiralDie(current * 2 + 2)}/></div></div>
                    <ol className="dt-attribute-track" aria-label={`Progressão de ${attribute.name}: estágio ${current} de 5`}>{attribute.stages.map((stage, i) => <li key={stage} className={i + 1 <= current ? 'reached' : ''} aria-current={i + 1 === current ? 'step' : undefined} title={`Estágio ${i + 1}: ${stage}`}><span/><small>{i + 1}</small></li>)}</ol>
                    <div className="dt-attribute-next">{maxed ? <><span>CAMINHO CONCLUÍDO</span><strong>{attribute.stages[4]}</strong><small>Você alcançou o estágio máximo.</small></> : <><span>PRÓXIMO ESTÁGIO / {next}</span><div><strong>{attribute.stages[next - 1]}</strong><EspiralDice value={espiralDie(next * 2 + 2)}/></div><small>d{current * 2 + 2} → d{next * 2 + 2}</small></>}</div>
                    <footer>
                      <div className="dt-attribute-cost"><span>{maxed ? 'PROGRESSÃO' : 'INVESTIMENTO'}</span><strong>{maxed ? 'Completa' : <>{cost}<small> pontos</small></>}</strong></div>
                      <button
                        type="button"
                        aria-label={maxed ? `${attribute.name}: estágio máximo` : `Evoluir ${attribute.name} para o estágio ${next}`}
                        disabled={loading || saving || maxed || points < cost}
                        onClick={() => upgradeAttribute(key)}
                      >
                        {maxed ? 'Estágio máximo' : saving ? 'Salvando…' : 'Evoluir atributo'}<span aria-hidden="true">{maxed ? '✓' : '↗'}</span>
                      </button>
                      <p className="dt-attribute-budget">{maxed ? 'Todos os cinco estágios alcançados.' : missing ? `Faltam ${missing} ponto${missing === 1 ? '' : 's'} de evolução.` : `Saldo após o avanço: ${points - cost} ponto${points - cost === 1 ? '' : 's'}.`}</p>
                      <div className="dt-attribute-reduce">
                        <button type="button" disabled={loading || saving || current <= 1} aria-label={`Diminuir ${attribute.name}`} onClick={() => downgradeAttribute(key)}>
                          <span>− Diminuir estágio</span><strong>{current > 1 ? `+${attributeCosts[current]} pontos` : 'Mínimo'}</strong>
                        </button>
                        <small>{current > 1 ? `Estágio ${current - 1} · d${current * 2 + 2} → d${current * 2} · ${attribute.stages[current - 2]}` : 'O atributo não pode ficar abaixo do estágio 1.'}</small>
                      </div>
                    </footer>
                  </article>
                );
              })}
              </div>
            </section>
          )}
          {activeSection === "habilidades" && (
            <DarknessTransformationCatalog owned={sheet.evolution?.abilities || []} points={points} busy={loading || saving} onAcquire={acquireAbility} onUpgrade={upgradeAbility} />
          )}
          {activeSection === "vertente" && (
            <section className="transformacao-vertente-area">
              <article className="transformacao-vertente-card">
                <span>VERTENTE ATUAL · NÍVEL {vertenteLevel}</span>
                <h2>{sheet.vertente}</h2>
                <h3>{vertenteAbility.nome}</h3>
                <div className="transformacao-vertente-levels">
                  {vertenteAbility.niveis.map((detail, index) => {
                    const level = index + 1;
                    return (
                      <div className={level === vertenteLevel ? "current" : level === vertenteLevel + 1 ? "next" : ""} key={detail}>
                        <b>NÍVEL {roman[level]}</b>
                        <p>{detail}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="transformacao-upgrade-action">
                  <strong>{vertenteLevel >= 3 ? "HABILIDADE NO NÍVEL MÁXIMO" : "PRÓXIMO NÍVEL · 3 PONTOS DE EVOLUÇÃO"}</strong>
                  <button type="button" disabled={loading || saving || vertenteLevel >= 3 || points < 3} onClick={upgradeVertente}>
                    {vertenteLevel >= 3 ? <Icon path={mdiLockOutline} size={0.75} /> : <Icon path={mdiPlus} size={0.75} />}{" "}
                    {vertenteLevel >= 3 ? "Nível máximo" : `Aprimorar para o Nível ${vertenteLevel + 1} · 3 pontos`}
                  </button>
                </div>
              </article>
              <article className="transformacao-vertente-change">
                <span>TROCAR VERTENTE</span>
                <h2>Uma mudança de caminho</h2>
                <p>A troca não custa Pontos de Evolução, mas deve acontecer após um marco narrativo importante e com aprovação do Mestre. A nova Habilidade de Vertente começa no Nível I.</p>
                <label htmlFor="transformacao-vertente-select">NOVA VERTENTE</label>
                <select id="transformacao-vertente-select" value={selectedVertente} onChange={(event) => setSelectedVertente(event.target.value)}>
                  {Object.keys(VERTENTES).map((vertente) => <option value={vertente} key={vertente}>{vertente}</option>)}
                </select>
                <button type="button" disabled={loading || saving || selectedVertente === sheet.vertente} onClick={trocarVertente}>Trocar Vertente · sem custo</button>
              </article>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

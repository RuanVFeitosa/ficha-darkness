import React, { useEffect, useMemo, useState } from "react";
import {
  mdiArrowLeft,
  mdiLockOutline,
  mdiPlus,
  mdiStarFourPoints,
} from "@mdi/js";
import Icon from "@mdi/react";
import { ATTRIBUTES, GRADES, RESOURCES, freshSheet } from "../data/espiral";
import {
  APRIMORAMENTOS_HABILIDADES_ESPIRAL,
  CUSTOS_ESPERANCA_HABILIDADES,
  HABILIDADES_ESPIRAL,
} from "../data/habilidadesEspiral";
import "../CSS/TransformacaoEspiral.css";

const storageKey = (id) => `espiral:sheet:v1:${id}`;
const loadSheet = (id) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(id)) || "null");
    return saved?.version === 1 ? { ...freshSheet(), ...saved } : freshSheet();
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
  const [activeSection, setActiveSection] = useState("recursos");
  const [abilityCategory, setAbilityCategory] = useState("Ofensiva");
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [notice, setNotice] = useState("");
  const points = Math.max(0, Number(sheet.evolution?.points) || 0);
  const characterName = sheet.name || "ARQUIVO SEM IDENTIDADE";
  const save = (next, message) => {
    setSheet(next);
    localStorage.setItem(storageKey(id), JSON.stringify(next));
    setNotice(message);
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
  const acquireAbility = (ability) => {
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
      `${ability[0]} foi incorporada ao arquivo.`,
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
      `${ability.name} avançou para o Nível ${ability.level + 1}.`,
    );
  };
  const currentLabel = useMemo(
    () =>
      activeSection === "recursos"
        ? "Evoluindo recursos"
        : activeSection === "atributos"
          ? "Evoluindo atributos"
          : "Novas habilidades",
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
        <span>ESPIRAL // PROGRESSÃO DE CAMPO</span>
        <h1>Transformação</h1>
        <p>
          A experiência muda quem sobrevive. O Mestre define os Pontos de
          Evolução recebidos ao final de cada sessão.
        </p>
        <div className="transformacao-spiral" aria-hidden="true" />
      </header>
      <section className="transformacao-shell">
        <aside className="transformacao-side">
          <span>ARQUIVO ATIVO</span>
          <strong>{characterName}</strong>
          <div />
          <small>PONTOS DE EVOLUÇÃO</small>
          <b>{points}</b>
          <p>
            Este saldo é concedido pelo Mestre. Cada avanço consome pontos e
            acontece um estágio por vez.
          </p>
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
          </nav>
          <div className="transformacao-heading">
            <span>{currentLabel.toUpperCase()}</span>
            <p>
              {activeSection === "recursos"
                ? "Recursos representam treino, conhecimento e experiência prática."
                : activeSection === "atributos"
                  ? "Atributos são capacidades amplas e evoluem mais lentamente."
                  : "Novas habilidades poderão ser escolhidas por 3 Pontos de Evolução."}
            </p>
          </div>
          {notice && (
            <p className="transformacao-notice" role="status">
              {notice}
            </p>
          )}
          {activeSection === "recursos" && (
            <div className="transformacao-list">
              {RESOURCES.map((name) => {
                const current = Number(sheet.resources?.[name]) || 0;
                const next = current + 1;
                const cost = resourceCosts[next];
                const maxed = current >= 4;
                return (
                  <article className="transformacao-card" key={name}>
                    <div>
                      <span>RECURSO</span>
                      <h2>{name}</h2>
                      <p>
                        Grau atual:{" "}
                        <b>
                          {roman[current]} · {GRADES[current]}
                        </b>
                      </p>
                    </div>
                    <div className="transformacao-card-action">
                      <small>
                        {maxed
                          ? "DOMINADO"
                          : `${roman[next]} · ${GRADES[next]}`}
                      </small>
                      <strong>
                        {maxed
                          ? "—"
                          : `${cost} ${cost === 1 ? "PONTO" : "PONTOS"}`}
                      </strong>
                      <button
                        type="button"
                        disabled={maxed || points < cost}
                        onClick={() => upgradeResource(name)}
                      >
                        {maxed ? (
                          <Icon path={mdiLockOutline} size={0.75} />
                        ) : (
                          <Icon path={mdiPlus} size={0.75} />
                        )}{" "}
                        {maxed ? "Concluído" : "Avançar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {activeSection === "atributos" && (
            <div className="transformacao-list">
              {Object.entries(ATTRIBUTES).map(([key, attribute]) => {
                const current = Number(sheet.attributes?.[key]) || 1;
                const next = current + 1;
                const cost = attributeCosts[next];
                const maxed = current >= 5;
                return (
                  <article className="transformacao-card" key={key}>
                    <div>
                      <span>ATRIBUTO</span>
                      <h2>{attribute.name}</h2>
                      <p>
                        {attribute.hint} · Estágio atual:{" "}
                        <b>
                          {current} · d{current * 2 + 2}
                        </b>
                      </p>
                    </div>
                    <div className="transformacao-card-action">
                      <small>
                        {maxed
                          ? "ESTÁGIO MÁXIMO"
                          : `ESTÁGIO ${next} · d${next * 2 + 2}`}
                      </small>
                      <strong>{maxed ? "—" : `${cost} PONTOS`}</strong>
                      <button
                        type="button"
                        disabled={maxed || points < cost}
                        onClick={() => upgradeAttribute(key)}
                      >
                        {maxed ? (
                          <Icon path={mdiLockOutline} size={0.75} />
                        ) : (
                          <Icon path={mdiPlus} size={0.75} />
                        )}{" "}
                        {maxed ? "Concluído" : "Avançar"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {activeSection === "habilidades" && (
            <section className="transformacao-ability-area">
              <div className="transformacao-ability-categories">
                {Object.keys(HABILIDADES_ESPIRAL).map((name) => (
                  <button
                    type="button"
                    className={abilityCategory === name ? "active" : ""}
                    onClick={() => {
                      setAbilityCategory(name);
                      setSelectedAbility(null);
                    }}
                    key={name}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div
                className="transformacao-spiral-map"
                aria-label={`Habilidades de ${abilityCategory}`}
              >
                {HABILIDADES_ESPIRAL[abilityCategory].map((ability, index) => {
                  const id = `${abilityCategory}:${ability[0]}`;
                  const acquired = (sheet.evolution?.abilities || []).some(
                    (item) => item.id === id,
                  );
                  return (
                    <button
                      type="button"
                      className={`transformacao-ability-node ${selectedAbility?.[0] === ability[0] ? "selected" : ""} ${acquired ? "acquired" : ""}`}
                      style={{ "--node": index }}
                      onClick={() => setSelectedAbility(ability)}
                      key={ability[0]}
                    >
                      <i>{String(index + 1).padStart(2, "0")}</i>
                      <span>{ability[0]}</span>
                      {acquired && <b>●</b>}
                    </button>
                  );
                })}
                <div className="transformacao-spiral-core">
                  <Icon path={mdiStarFourPoints} size={1.15} />
                  <span>SEM PRÉ-REQUISITOS</span>
                </div>
              </div>
              <aside className="transformacao-ability-detail">
                {selectedAbility ? (
                  <>
                    {(() => {
                      const owned = (sheet.evolution?.abilities || []).find(
                        (item) =>
                          item.id ===
                          `${abilityCategory}:${selectedAbility[0]}`,
                      );
                      const details = APRIMORAMENTOS_HABILIDADES_ESPIRAL[
                        selectedAbility[0]
                      ] || [
                        selectedAbility[2],
                        "Aprimoramento de Nível II.",
                        "Aprimoramento de Nível III.",
                      ];
                      const cost = CUSTOS_ESPERANCA_HABILIDADES[
                        selectedAbility[0]
                      ] || [0, 0];
                      const dots = (amount) =>
                        amount ? "૦".repeat(amount) : "—";
                      return (
                        <>
                          <span>
                            {abilityCategory.toUpperCase()} · AÇÃO{" "}
                            {selectedAbility[1].toUpperCase()}
                          </span>
                          <h2>{selectedAbility[0]}</h2>
                          <div className="transformacao-hope-cost">
                            <span>CUSTO DE ESPERANÇA</span>
                            <b>
                              {cost[0]
                                ? `${dots(cost[0])} FRACASSO / ${dots(cost[1])} SUCESSO COM CONSEQUÊNCIA`
                                : "— SEM CUSTO"}
                            </b>
                          </div>
                          <div className="transformacao-level-one">
                            <b>▰ ▱ ▱ NÍVEL 1</b>
                            <p>{details[0]}</p>
                          </div>
                          <div className="transformacao-levels">
                            {details.slice(1).map((detail, index) => {
                              const level = index + 2;
                              return (
                              <div
                                className={
                                  level === (owned?.level || 1)
                                    ? "current"
                                    : level === (owned?.level || 1) + 1
                                      ? "next"
                                      : ""
                                }
                                key={detail}
                              >
                                <b>
                                  {level === 2 ? "▰ ▰ ▱" : "▰ ▰ ▰"} NÍVEL {level}
                                </b>
                                <small>{detail}</small>
                              </div>
                              );
                            })}
                          </div>
                          {owned ? (
                            <div className="transformacao-upgrade-action">
                              <strong>ADQUIRIDA · NÍVEL {owned.level}</strong>
                              <button
                                type="button"
                                disabled={owned.level >= 3 || points < 3}
                                onClick={() => upgradeAbility(owned.id)}
                              >
                                {owned.level >= 3 ? (
                                  <Icon path={mdiLockOutline} size={0.75} />
                                ) : (
                                  <Icon path={mdiPlus} size={0.75} />
                                )}{" "}
                                {owned.level >= 3
                                  ? "Nível máximo"
                                  : `Aprimorar para o Nível ${owned.level + 1} · 3 pontos`}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={points < 3}
                              onClick={() => acquireAbility(selectedAbility)}
                            >
                              <Icon path={mdiPlus} size={0.75} /> Adquirir · 3
                              pontos
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <Icon path={mdiStarFourPoints} size={1.3} />
                    <h2>Escolha uma possibilidade</h2>
                    <p>
                      As habilidades não formam uma árvore. Selecione um ponto
                      da espiral para consultar e adquirir a habilidade que
                      fizer sentido para sua história.
                    </p>
                  </>
                )}
              </aside>
              {(sheet.evolution?.abilities || []).length > 0 && (
                <section className="transformacao-owned-list">
                  <span>HABILIDADES ADQUIRIDAS</span>
                  {sheet.evolution.abilities.map((item) => (
                    <article key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <small>
                          {item.category} · NÍVEL {item.level}
                        </small>
                      </div>
                      <button
                        type="button"
                        disabled={item.level >= 3 || points < 3}
                        onClick={() => upgradeAbility(item.id)}
                      >
                        {item.level >= 3 ? "Máximo" : `Aprimorar · 3`}
                      </button>
                    </article>
                  ))}
                </section>
              )}
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

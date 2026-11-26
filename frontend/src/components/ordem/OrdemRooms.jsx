import React, { useState } from "react";
import Icon from "@mdi/react";
import { mdiBriefcaseOutline, mdiDiamondOutline, mdiShieldOutline, mdiSword, mdiTarget } from "@mdi/js";
import { classes } from "../../services/ordemCreation";
import { equipmentCatalog } from "../../services/ordemEquipment";
import { powerCatalog } from "../../services/ordemPowerCatalog";
import { normalizeOrdem, ordemId } from "../../services/ordemSheet";
import { equipmentIcons } from "./equipmentIcons";

const rooms = [
  {
    id: "ivete",
    title: "Loja de Armas da Ivete",
    description: "Itens, armas e proteções",
  },
  {
    id: "agatha",
    title: "Sala de Rituais da Agatha",
    description: "Poderes e rituais",
  },
  {
    id: "transcendencia",
    title: "Sala de Transcendência",
    description: "NEX, trilhas e habilidades de classe",
  },
];

const equipmentGroupIcons = {
  Armas: mdiSword,
  Proteções: mdiShieldOutline,
  Munições: mdiTarget,
  Equipamentos: mdiBriefcaseOutline,
  "Itens paranormais": mdiDiamondOutline,
};

const equipmentIcon = (item) => equipmentIcons[item.name] ?? equipmentGroupIcons[item.group];

function Equipment({ sheet, onPatch }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [added, setAdded] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const visible = equipmentCatalog.filter(
    (item) =>
      (!group || item.group === group) &&
      normalizeOrdem(item.name).includes(normalizeOrdem(query.trim())),
  );
  const featuredItem = visible.includes(selectedItem)
    ? selectedItem
    : visible[0];

  function add(item) {
    const existing = sheet.inventory.find(
      (entry) => entry.catalogKey === item.name,
    );
    const inventory = existing
      ? sheet.inventory.map((entry) =>
          entry.id === existing.id
            ? { ...entry, quantity: (entry.quantity || 1) + 1 }
            : entry,
        )
      : [
          ...sheet.inventory,
          {
            id: ordemId(),
            catalogKey: item.name,
            name: item.name,
            detail: item.detail,
            quantity: 1,
          },
        ];
    const attacks =
      item.damage &&
      !sheet.attacks.some((entry) => entry.catalogKey === item.name)
        ? [
            ...sheet.attacks,
            {
              id: ordemId(),
              catalogKey: item.name,
              name: item.name,
              detail: item.damage,
              skill: item.skill,
            },
          ]
        : sheet.attacks;
    onPatch({ inventory, attacks });
    setAdded(item.name);
  }

  return (
    <>
      <div className="os-shop-filters">
        <div className="os-shop-categories" role="group" aria-label="Categoria">
          {["", ...Object.keys(equipmentGroupIcons)].map((name) => (
            <button type="button" key={name} aria-pressed={group === name} onClick={() => setGroup(name)}>
              {name || "Todas"}
            </button>
          ))}
        </div>
        <label>
          Buscar equipamento
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      {added && <p role="status">{added} adicionado ao inventário.</p>}
      {featuredItem ? (
        <div className="os-equipment-browser">
          <div
            className="os-equipment-shelf"
            aria-label="Equipamentos disponíveis"
            role="group"
          >
            {visible.map((item) => (
              <button
                type="button"
                key={`${item.group}:${item.name}`}
                aria-pressed={item === featuredItem}
                onClick={() => setSelectedItem(item)}
              >
                <Icon path={equipmentIcon(item)} size={1.4} aria-hidden="true" />
                <strong>{item.name}</strong>
              </button>
            ))}
          </div>
          <article className="os-equipment-preview">
            <div className="os-equipment-display">
              <Icon path={equipmentIcon(featuredItem)} size={3} aria-hidden="true" />
            </div>
            <small>{featuredItem.group}</small>
            <h3>{featuredItem.name}</h3>
            <dl>{featuredItem.detail.split(" · ").map((detail) => {
              const [label, ...value] = detail.split(" ");
              return <div key={label}><dt>{label}</dt><dd>{value.join(" ")}</dd></div>;
            })}</dl>
            <button
              type="button"
              aria-label={`Pegar ${featuredItem.name}`}
              onClick={() => add(featuredItem)}
            >
              Adicionar ao inventário
            </button>
          </article>
        </div>
      ) : (
        <p className="os-muted">Nenhum equipamento encontrado.</p>
      )}
    </>
  );
}

const advances = {
  Combatente: { pv: 4, san: 3, pe: 2 },
  Especialista: { pv: 3, san: 4, pe: 3 },
  Ocultista: { pv: 2, san: 5, pe: 4 },
};
const trailLevels = [10, 40, 65, 99];
const powerLevels = [15, 30, 45, 60, 75, 90];
const own = (sheet, entry) =>
  sheet.abilities.some(
    (power) => power.catalogId === entry.catalogId || power.name === entry.name,
  );

function Progression({ sheet, onPatch }) {
  const [milestone, setMilestone] = useState(null);
  const [power, setPower] = useState(null);
  const advancement = advances[sheet.classe];
  const next = sheet.nex === 95 ? 99 : sheet.nex + 5;
  const valid = Boolean(
    advancement && sheet.nex >= 5 && sheet.nex <= 95 && sheet.nex % 5 === 0,
  );
  const classEntries = powerCatalog.filter(
    (entry) => entry.category === sheet.classe,
  );
  const trails = classEntries.filter((entry) => entry.nex === 10);
  const trailPowers = classEntries.filter(
    (entry) => entry.group === sheet.trilha && trailLevels.includes(entry.nex),
  );
  const classPowers = classEntries.filter((entry) => entry.nex === 15);
  const milestones = powerLevels.filter((level) => level <= sheet.nex);
  const chosenLevels = new Set(
    sheet.abilities.map((power) => power.progressionLevel).filter(Boolean),
  );
  const openLevel = milestones.find((level) => !chosenLevels.has(level));
  const resources = sheet.resources;

  function advance() {
    const gains = {
      pv:
        advancement.pv +
        sheet.attributes.VIG +
        Number(sheet.origem === "Desgarrado") +
        2 *
          Number(
            sheet.abilities.some((power) => power.name === "Sangue de Ferro"),
          ),
      san: advancement.san + Number(sheet.origem === "Vítima"),
      pe:
        advancement.pe +
        sheet.attributes.PRE +
        Number(sheet.origem === "Universitário" && next % 10 === 5) +
        Number(
          sheet.abilities.some(
            (power) => power.name === "Potencial Aprimorado",
          ),
        ),
    };
    onPatch({
      nex: next,
      limitePe:
        (next === 99 ? 20 : next / 5) +
        Number(sheet.origem === "Universitário"),
      resources: Object.fromEntries(
        Object.entries(resources).map(([key, value]) => [
          key,
          {
            ...value,
            max: value.max + gains[key],
            current: value.current + gains[key],
          },
        ]),
      ),
      abilities: [
        ...sheet.abilities,
        ...trailPowers
          .filter((entry) => entry.nex === next && !own(sheet, entry))
          .map((entry) => ({ ...entry, id: ordemId() })),
      ],
    });
  }

  function chooseTrail(trail) {
    const abilities = classEntries.filter(
      (entry) =>
        entry.group === trail &&
        trailLevels.includes(entry.nex) &&
        entry.nex <= sheet.nex &&
        !own(sheet, entry),
    );
    onPatch({
      trilha: trail,
      abilities: [
        ...sheet.abilities,
        ...abilities.map((entry) => ({ ...entry, id: ordemId() })),
      ],
    });
  }

  const activeMilestone = trailPowers.find(entry => entry.catalogId === milestone)
    ?? [...trailPowers].reverse().find(entry => entry.nex <= sheet.nex)
    ?? trailPowers[0];
  const activePower = classPowers.find(entry => entry.catalogId === power);

  return (
    <div className="os-progression">
      <section className="os-progression-panel" aria-label="Avanço e trilha">
        <div className="os-work-heading">
          <div>
            <h3>NEX {sheet.nex}%</h3>
            <p>
              {classes[sheet.classe]
                ? sheet.classe
                : "Defina a classe no modo de edição."}
            </p>
          </div>
          {valid && (
            <button type="button" onClick={advance}>
              Avançar para {next}%
            </button>
          )}
        </div>
        {sheet.nex >= 10 && trails.length > 0 && (
          <label>
            Trilha de classe
            <select
              value={sheet.trilha || ""}
              disabled={Boolean(sheet.trilha)}
              onChange={(event) => chooseTrail(event.target.value)}
            >
              <option value="">Escolher trilha</option>
              {trails.map((entry) => (
                <option key={entry.catalogId}>{entry.group}</option>
              ))}
              {sheet.trilha &&
                !trails.some((entry) => entry.group === sheet.trilha) && (
                  <option>{sheet.trilha}</option>
                )}
            </select>
          </label>
        )}
        {sheet.nex < 10 && (
          <p className="os-muted">A escolha de trilha abre em NEX 10%.</p>
        )}
        {activeMilestone && (
          <>
            <div className="os-milestone-map" role="group" aria-label="Marcos da trilha">
              {trailPowers.map(entry => (
                <button type="button" key={entry.catalogId}
                  aria-pressed={entry === activeMilestone}
                  data-reached={entry.nex <= sheet.nex}
                  onClick={() => setMilestone(entry.catalogId)}>
                  <span>{entry.nex}%</span>
                  {entry.name}
                </button>
              ))}
            </div>
            <article className="os-progression-reading">
              <small>{own(sheet, activeMilestone) ? "Adquirido" : `NEX ${activeMilestone.nex}%`}</small>
              <h4>{activeMilestone.name}</h4>
              <p>{activeMilestone.detail}</p>
              {activeMilestone.nex <= sheet.nex && !own(sheet, activeMilestone) && (
                <button type="button" onClick={() => onPatch({
                  abilities: [...sheet.abilities, { ...activeMilestone, id: ordemId() }],
                })}>Aprender</button>
              )}
            </article>
          </>
        )}
      </section>
      <img className="os-progression-symbol" src="/ordem-salas/transcendencia.png" alt="" />
      <section className="os-progression-panel" aria-label="Poderes de classe">
        {openLevel ? (
          <>
            <h3>Poder de classe · NEX {openLevel}%</h3>
            {activePower ? (
              <article className="os-progression-reading">
                <button type="button" onClick={() => setPower(null)}>← Ver cartas</button>
                <h4>{activePower.name}</h4>
                <p>{activePower.detail}</p>
                <button type="button" disabled={own(sheet, activePower)} onClick={() => {
                  onPatch({ abilities: [...sheet.abilities, {
                    ...activePower, id: ordemId(), progressionLevel: openLevel,
                  }] });
                  setPower(null);
                }}>{own(sheet, activePower) ? "Adquirido" : "Aprender"}</button>
              </article>
            ) : (
              <div className="os-power-deck">
                {classPowers.map(entry => (
                  <button type="button" key={entry.catalogId} onClick={() => setPower(entry.catalogId)}>
                    <span aria-hidden="true">◇</span>
                    <strong>{entry.name}</strong>
                    {own(sheet, entry) && <small>Adquirido</small>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h3>Poderes de classe</h3>
            <p className="os-muted">Nenhuma escolha disponível neste NEX.</p>
          </>
        )}
      </section>
    </div>
  );
}

export default function OrdemRooms({
  sheet,
  onPatch,
  renderPowers,
  renderRituals,
  entry,
}) {
  const [room, setRoom] = useState(entry?.room ?? "");
  const [agatha, setAgatha] = useState(
    entry?.catalog === "Poderes" ? "Poderes Paranormais" : "Rituais",
  );
  const selected = rooms.find((entry) => entry.id === room);
  if (!selected)
    return (
      <section className="os-rooms-hub" aria-label="Salas da Ordem">
        <h2>Salas da Ordem</h2>
        <div className="os-room-list">
          {rooms.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className={`os-room-card os-room-${entry.id}`}
              onClick={() => setRoom(entry.id)}
            >
              <img src={`/ordem-salas/${entry.id}.png`} alt="" />
              <span>
                <strong>{entry.title}</strong>
                <small>{entry.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  return (
    <section
      className="os-room-stage"
      data-room={room}
      aria-label={selected.title}
    >
      {room !== "transcendencia" && <img
        className="os-room-scenery"
        src={
          room === "agatha"
            ? "/ordem-salas/agatha-cenario.jpg"
            : `/ordem-salas/${room}.png`
        }
        alt=""
      />}
      {room === "agatha" && (
        <img
          className="os-agatha-portrait"
          src="/ordem-salas/agatha-retrato.png"
          alt=""
        />
      )}
      <div className="os-room-content">
        <button
          type="button"
          className="os-room-back"
          onClick={() => {
            setRoom("");
            setAgatha("Rituais");
          }}
        >
          ← Todas as salas
        </button>
        <h2>{selected.title}</h2>
        <div className="os-room-controls">
          {room === "ivete" && <Equipment sheet={sheet} onPatch={onPatch} />}
          {room === "transcendencia" && (
            <Progression sheet={sheet} onPatch={onPatch} />
          )}
          {room === "agatha" && (
            <>
              <nav className="os-room-tabs" aria-label="Catálogos da Agatha">
                {["Rituais", "Poderes Paranormais"].map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={agatha === name}
                    onClick={() => setAgatha(name)}
                  >
                    {name}
                  </button>
                ))}
              </nav>
              {agatha === "Rituais" ? renderRituals() : renderPowers()}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

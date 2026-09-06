import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@mdi/react";
import {
  mdiDeleteOutline,
  mdiDoor,
  mdiEyeOutline,
  mdiFlashlight,
  mdiLightbulbOnOutline,
  mdiUndo,
  mdiWall,
  mdiWeatherNight,
  mdiWeatherSunny,
} from "@mdi/js";

const VAZIO = { paredes: [], portas: [], luzes: [], escuridao: 0.82, periodo: "dia" };
const limitar = (valor, minimo = 0, maximo = 100) =>
  Math.max(minimo, Math.min(maximo, valor));
const idNovo = (prefixo) =>
  `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const intersecaoRaioSegmento = (origem, angulo, parede) => {
  const dx = Math.cos(angulo);
  const dy = Math.sin(angulo);
  const sx = parede.x2 - parede.x1;
  const sy = parede.y2 - parede.y1;
  const divisor = dx * sy - dy * sx;
  if (Math.abs(divisor) < 0.000001) return null;
  const ox = parede.x1 - origem.x;
  const oy = parede.y1 - origem.y;
  const distancia = (ox * sy - oy * sx) / divisor;
  const posicao = (ox * dy - oy * dx) / divisor;
  if (distancia < 0 || posicao < 0 || posicao > 1) return null;
  return { x: origem.x + dx * distancia, y: origem.y + dy * distancia, distancia };
};

export const pontoVisivelPorLuz = (luz, ponto, bloqueadores = []) => {
  if (!luz || !ponto) return false;
  const dx = Number(ponto.x) - Number(luz.x);
  const dy = Number(ponto.y) - Number(luz.y);
  const distancia = Math.hypot(dx, dy);
  if (distancia > (Number(luz.alcance) || 18)) return false;
  const angulo = Math.atan2(dy, dx);
  if (luz.tipo === "cone") {
    const direcao = Number(luz.direcao) || 0;
    const abertura = ((Number(luz.abertura) || 70) * Math.PI) / 180;
    const diferenca = Math.atan2(
      Math.sin(angulo - direcao),
      Math.cos(angulo - direcao),
    );
    if (Math.abs(diferenca) > abertura / 2) return false;
  }
  return !bloqueadores.some((bloqueador) => {
    const colisao = intersecaoRaioSegmento(luz, angulo, bloqueador);
    return colisao && colisao.distancia < distancia - 0.08;
  });
};

export const pontoVisivelPorObservadores = (observadores, ponto, bloqueadores = []) =>
  observadores.some((origem) => pontoVisivelPorLuz(
    { x: Number(origem.x), y: Number(origem.y), alcance: 150 }, ponto, bloqueadores,
  ));

export const poligonoVisibilidade = (luz, paredes) => {
  const alcance = Number(luz.alcance || 22);
  const direcional = luz.tipo === "cone";
  const direcao = Number(luz.direcao) || 0;
  const abertura = ((Number(luz.abertura) || 70) * Math.PI) / 180;
  const limites = [
    { x1: 0, y1: 0, x2: 100, y2: 0 },
    { x1: 100, y1: 0, x2: 100, y2: 100 },
    { x1: 100, y1: 100, x2: 0, y2: 100 },
    { x1: 0, y1: 100, x2: 0, y2: 0 },
  ];
  const angulos = [];
  const segmentos = [...paredes, ...limites];
  const dentroDoCone = (angulo) => {
    if (!direcional) return true;
    const diferenca = Math.atan2(
      Math.sin(angulo - direcao),
      Math.cos(angulo - direcao),
    );
    return Math.abs(diferenca) <= abertura / 2 + 0.001;
  };
  segmentos.forEach((parede) => {
    [
      Math.atan2(parede.y1 - luz.y, parede.x1 - luz.x),
      Math.atan2(parede.y2 - luz.y, parede.x2 - luz.x),
    ].forEach((angulo) => {
      if (dentroDoCone(angulo))
        angulos.push(angulo - 0.0001, angulo, angulo + 0.0001);
    });
  });
  if (direcional) {
    for (let i = 0; i <= 64; i += 1)
      angulos.push(direcao - abertura / 2 + (abertura * i) / 64);
  } else {
    for (let i = 0; i < 96; i += 1) angulos.push((Math.PI * 2 * i) / 96);
  }
  const ordenados = direcional
    ? angulos.sort((a, b) => {
        const relativoA = Math.atan2(Math.sin(a - direcao), Math.cos(a - direcao));
        const relativoB = Math.atan2(Math.sin(b - direcao), Math.cos(b - direcao));
        return relativoA - relativoB;
      })
    : angulos.map((angulo) => Math.atan2(Math.sin(angulo), Math.cos(angulo))).sort((a, b) => a - b);
  const pontos = ordenados.map((angulo) => {
      let ponto = {
        x: luz.x + Math.cos(angulo) * alcance,
        y: luz.y + Math.sin(angulo) * alcance,
        distancia: alcance,
      };
      segmentos.forEach((parede) => {
        const colisao = intersecaoRaioSegmento(luz, angulo, parede);
        if (colisao && colisao.distancia < ponto.distancia) ponto = colisao;
      });
      return `${limitar(ponto.x)},${limitar(ponto.y)}`;
    });
  if (direcional) pontos.unshift(`${luz.x},${luz.y}`);
  return pontos.join(" ");
};

const normalizar = (configuracao) => ({
  ...VAZIO,
  ...(configuracao || {}),
  paredes: Array.isArray(configuracao?.paredes) ? configuracao.paredes : [],
  portas: Array.isArray(configuracao?.portas) ? configuracao.portas : [],
  luzes: Array.isArray(configuracao?.luzes) ? configuracao.luzes : [],
  periodo:
    configuracao?.periodo ||
    (Number(configuracao?.escuridao) > 0 ? "noite" : "dia"),
});

const MapLightingLayer = ({ configuracao, luzesTokens = [], observadores = null, editando, aoAlterar, salvando }) => {
  const svgRef = useRef(null);
  const [ferramenta, setFerramenta] = useState("parede");
  const [paredeRascunho, setParedeRascunho] = useState(null);
  const dados = normalizar(configuracao);
  const bloqueadores = useMemo(
    () => [...dados.paredes, ...dados.portas.filter((porta) => !porta.aberta)],
    [dados.paredes, dados.portas],
  );
  const pontosLuz = useMemo(
    () => [...dados.luzes, ...luzesTokens].map((luz) => ({ ...luz, poligono: poligonoVisibilidade(luz, bloqueadores) })),
    [dados.luzes, bloqueadores, luzesTokens],
  );
  const camposVisao = useMemo(
    () => observadores?.map((origem) => poligonoVisibilidade(
      { x: Number(origem.x), y: Number(origem.y), alcance: 150 }, bloqueadores,
    )),
    [observadores, bloqueadores],
  );

  const pontoDoEvento = (evento) => {
    const caixa = svgRef.current.getBoundingClientRect();
    return {
      x: limitar(((evento.clientX - caixa.left) / caixa.width) * 100),
      y: limitar(((evento.clientY - caixa.top) / caixa.height) * 100),
    };
  };

  const iniciar = (evento) => {
    if (!editando || evento.button !== 0) return;
    evento.stopPropagation();
    const ponto = pontoDoEvento(evento);
    if (ferramenta === "parede" || ferramenta === "porta") {
      setParedeRascunho({ id: idNovo(ferramenta), tipo: ferramenta, x1: ponto.x, y1: ponto.y, x2: ponto.x, y2: ponto.y });
    } else if (ferramenta === "luz") {
      aoAlterar({ ...dados, luzes: [...dados.luzes, { id: idNovo("luz"), ...ponto, alcance: 24, intensidade: 1, cor: "#f4c76b" }] });
    }
  };

  const mover = (evento) => {
    if (!paredeRascunho) return;
    evento.stopPropagation();
    setParedeRascunho({ ...paredeRascunho, ...Object.fromEntries(Object.entries(pontoDoEvento(evento)).map(([chave, valor]) => [`${chave}2`, valor])) });
  };

  const finalizar = (evento) => {
    if (!paredeRascunho) return;
    evento.stopPropagation();
    const tamanho = Math.hypot(paredeRascunho.x2 - paredeRascunho.x1, paredeRascunho.y2 - paredeRascunho.y1);
    if (tamanho > 0.4) {
      if (paredeRascunho.tipo === "porta")
        aoAlterar({ ...dados, portas: [...dados.portas, { ...paredeRascunho, aberta: false }] });
      else aoAlterar({ ...dados, paredes: [...dados.paredes, paredeRascunho] });
    }
    setParedeRascunho(null);
  };

  const desfazer = () => {
    if (ferramenta === "luz" && dados.luzes.length) aoAlterar({ ...dados, luzes: dados.luzes.slice(0, -1) });
    else if (ferramenta === "porta" && dados.portas.length) aoAlterar({ ...dados, portas: dados.portas.slice(0, -1) });
    else if (dados.paredes.length) aoAlterar({ ...dados, paredes: dados.paredes.slice(0, -1) });
  };

  return (
    <>
      <svg
        ref={svgRef}
        className={`mapa-iluminacao ${editando ? "editando" : ""}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={finalizar}
        onPointerCancel={() => setParedeRascunho(null)}
      >
        <defs>
          {camposVisao && (
            <mask id="mascara-visao-jogador" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <rect width="100" height="100" fill="white" />
              {camposVisao.map((pontos, indice) => <polygon key={indice} points={pontos} fill="black" />)}
            </mask>
          )}
          {pontosLuz.map((luz) => (
            <React.Fragment key={luz.id}>
              <radialGradient id={`gradiente-${luz.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="black" />
                <stop offset="55%" stopColor="black" stopOpacity="0.72" />
                <stop offset="100%" stopColor="white" />
              </radialGradient>
              <clipPath id={`recorte-${luz.id}`}><polygon points={luz.poligono} /></clipPath>
            </React.Fragment>
          ))}
          <mask id="mascara-escuridao">
            <rect width="100" height="100" fill="white" />
            {pontosLuz.map((luz) => (
              <circle key={luz.id} cx={luz.x} cy={luz.y} r={luz.alcance} fill={`url(#gradiente-${luz.id})`} clipPath={`url(#recorte-${luz.id})`} />
            ))}
          </mask>
        </defs>
        {dados.periodo === "noite" && (
          <rect className="mapa-escuridao" width="100" height="100" opacity={dados.escuridao} mask="url(#mascara-escuridao)" />
        )}
        {camposVisao && !editando && (
          <rect className="mapa-fora-de-visao" width="100" height="100" fill="#020303" mask="url(#mascara-visao-jogador)" />
        )}
        {editando && (
          <g className="mapa-geometria-editor">
            {dados.paredes.map((parede) => {
              const apagarParede = (evento) => {
                if (ferramenta !== "apagar") return;
                evento.preventDefault();
                evento.stopPropagation();
                aoAlterar({
                  ...dados,
                  paredes: dados.paredes.filter((item) => item.id !== parede.id),
                });
              };
              return (
                <React.Fragment key={parede.id}>
                  <line
                    className="mapa-parede-hitbox"
                    x1={parede.x1}
                    y1={parede.y1}
                    x2={parede.x2}
                    y2={parede.y2}
                    onPointerDown={apagarParede}
                  />
                  <line
                    className="mapa-parede-visual"
                    x1={parede.x1}
                    y1={parede.y1}
                    x2={parede.x2}
                    y2={parede.y2}
                    onPointerDown={apagarParede}
                  />
                </React.Fragment>
              );
            })}
            {dados.portas.map((porta) => (
              <line
                key={porta.id}
                className={`mapa-porta ${porta.aberta ? "aberta" : "fechada"}`}
                x1={porta.x1}
                y1={porta.y1}
                x2={porta.x2}
                y2={porta.y2}
                onPointerDown={(evento) => {
                  evento.stopPropagation();
                  if (ferramenta === "apagar") {
                    aoAlterar({
                      ...dados,
                      portas: dados.portas.filter((item) => item.id !== porta.id),
                    });
                    return;
                  }
                  const proxima = {
                    ...dados,
                    portas: dados.portas.map((item) =>
                      item.id === porta.id ? { ...item, aberta: !item.aberta } : item,
                    ),
                  };
                  aoAlterar(proxima);
                }}
              />
            ))}
            {paredeRascunho && <line className="rascunho" x1={paredeRascunho.x1} y1={paredeRascunho.y1} x2={paredeRascunho.x2} y2={paredeRascunho.y2} />}
            {pontosLuz.map((luz) => (
              <circle
                className={`mapa-ponto-luz ${luz.tokenId ? "lanterna-token" : ""}`}
                key={luz.id}
                cx={luz.x}
                cy={luz.y}
                r={luz.tokenId ? "1.7" : "1.35"}
                onPointerDown={(evento) => {
                  if (ferramenta !== "apagar" || luz.tokenId) return;
                  evento.stopPropagation();
                  aoAlterar({
                    ...dados,
                    luzes: dados.luzes.filter((item) => item.id !== luz.id),
                  });
                }}
              />
            ))}
          </g>
        )}
      </svg>
      {editando && typeof document !== "undefined" && createPortal(
        <div className="mapa-editor-barra" onPointerDown={(evento) => evento.stopPropagation()}>
          <span><Icon path={mdiEyeOutline} size={0.65} /> Editor de visão</span>
          <div className="mapa-periodo" aria-label="Periodo do mapa">
            <button className={dados.periodo === "dia" ? "ativo" : ""} onClick={() => aoAlterar({ ...dados, periodo: "dia" })} title="Luz ambiente diurna; paredes e portas continuam bloqueando a visao"><Icon path={mdiWeatherSunny} size={0.72} /> Dia</button>
            <button className={dados.periodo === "noite" ? "ativo" : ""} onClick={() => aoAlterar({ ...dados, periodo: "noite", escuridao: Number(dados.escuridao) > 0 ? dados.escuridao : VAZIO.escuridao })} title="Ativar iluminacao e oclusao"><Icon path={mdiWeatherNight} size={0.72} /> Noite</button>
          </div>
          <button className={ferramenta === "parede" ? "ativo" : ""} onClick={() => setFerramenta("parede")} title="Desenhar parede"><Icon path={mdiWall} size={0.75} /> Parede</button>
          <button className={ferramenta === "porta" ? "ativo" : ""} onClick={() => setFerramenta("porta")} title="Desenhar porta fechada"><Icon path={mdiDoor} size={0.75} /> Porta</button>
          <button className={ferramenta === "luz" ? "ativo" : ""} onClick={() => setFerramenta("luz")} title="Adicionar luz"><Icon path={mdiLightbulbOnOutline} size={0.75} /> Luz</button>
          <button className={ferramenta === "apagar" ? "ativo perigo" : ""} onClick={() => setFerramenta("apagar")} title="Apagar um elemento"><Icon path={mdiDeleteOutline} size={0.75} /> Apagar</button>
          <label title="Escuridao ambiente"><Icon path={mdiFlashlight} size={0.7} /><input type="range" min="0" max="0.98" step="0.02" value={dados.escuridao} onChange={(evento) => aoAlterar({ ...dados, escuridao: Number(evento.target.value) })} /></label>
          <button onClick={desfazer} disabled={!dados.paredes.length && !dados.portas.length && !dados.luzes.length} title="Desfazer ultimo"><Icon path={mdiUndo} size={0.75} /></button>
          <small className={salvando ? "salvando" : ""}>{salvando ? "Sincronizando..." : "Salvo automaticamente"}</small>
        </div>,
        document.body,
      )}
    </>
  );
};

export default MapLightingLayer;

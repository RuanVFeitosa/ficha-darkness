import React, { useEffect, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiAlertOutline, mdiClose, mdiHelpCircleOutline, mdiInformationOutline } from "@mdi/js";
import "../CSS/DialogoGlobal.css";

const ouvintes = new Set();
const fila = [];

const publicar = () => {
  const atual = fila[0] || null;
  ouvintes.forEach((ouvinte) => ouvinte(atual));
};

const abrirDialogo = (configuracao) => new Promise((resolve) => {
  fila.push({ id: `${Date.now()}-${Math.random()}`, ...configuracao, resolve });
  publicar();
});

export const confirmarDialogo = (mensagem, opcoes = {}) => abrirDialogo({
  tipo: "confirmacao",
  titulo: "Confirmar acao",
  confirmarTexto: "Confirmar",
  cancelarTexto: "Cancelar",
  mensagem,
  ...opcoes,
});

export const alertarDialogo = (mensagem, opcoes = {}) => abrirDialogo({
  tipo: "aviso",
  titulo: "Aviso do sistema",
  confirmarTexto: "Entendido",
  mensagem,
  ...opcoes,
});

export const solicitarDialogo = (mensagem, opcoes = {}) => abrirDialogo({
  tipo: "entrada",
  titulo: "Informar dados",
  confirmarTexto: "Continuar",
  cancelarTexto: "Cancelar",
  mensagem,
  valorInicial: "",
  ...opcoes,
});

const iconePorTipo = {
  aviso: mdiInformationOutline,
  confirmacao: mdiHelpCircleOutline,
  entrada: mdiInformationOutline,
};

const DialogoGlobal = () => {
  const [dialogo, setDialogo] = useState(fila[0] || null);
  const [valor, setValor] = useState("");
  const campoRef = useRef(null);
  const confirmarRef = useRef(null);

  useEffect(() => {
    ouvintes.add(setDialogo);
    publicar();
    return () => ouvintes.delete(setDialogo);
  }, []);

  useEffect(() => {
    if (!dialogo) return undefined;
    setValor(dialogo.valorInicial || "");
    const timer = window.setTimeout(() => {
      (dialogo.tipo === "entrada" ? campoRef : confirmarRef).current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [dialogo]);

  const concluir = (resultado) => {
    const atual = fila.shift();
    atual?.resolve(resultado);
    publicar();
  };

  useEffect(() => {
    if (!dialogo) return undefined;
    const aoPressionar = (evento) => {
      if (evento.key === "Escape" && dialogo.tipo !== "aviso") concluir(dialogo.tipo === "entrada" ? null : false);
    };
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  });

  if (!dialogo) return null;

  const cancelar = () => concluir(dialogo.tipo === "entrada" ? null : false);
  const confirmar = () => concluir(dialogo.tipo === "entrada" ? valor : true);

  return (
    <div className="dialogo-global" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget && dialogo.tipo !== "aviso") cancelar();
    }}>
      <section className={`dialogo-global__painel ${dialogo.perigo ? "dialogo-global__painel--perigo" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialogo-global-titulo">
        <div className="dialogo-global__linha-superior" />
        <header className="dialogo-global__cabecalho">
          <div className="dialogo-global__icone">
            <Icon path={dialogo.perigo ? mdiAlertOutline : iconePorTipo[dialogo.tipo]} size={0.9} />
          </div>
          <div>
            <span className="dialogo-global__rotulo">PROTOCOLO DO TABLETOP</span>
            <h2 id="dialogo-global-titulo">{dialogo.titulo}</h2>
          </div>
          {dialogo.tipo !== "aviso" && (
            <button className="dialogo-global__fechar" type="button" onClick={cancelar} aria-label="Fechar">
              <Icon path={mdiClose} size={0.85} />
            </button>
          )}
        </header>

        <div className="dialogo-global__conteudo">
          <p>{dialogo.mensagem}</p>
          {dialogo.tipo === "entrada" && (
            <input ref={campoRef} value={valor} placeholder={dialogo.placeholder || "Digite aqui..."} onChange={(evento) => setValor(evento.target.value)} onKeyDown={(evento) => {
              if (evento.key === "Enter" && valor.trim()) confirmar();
            }} />
          )}
        </div>

        <footer className="dialogo-global__acoes">
          {dialogo.tipo !== "aviso" && <button type="button" className="dialogo-global__botao dialogo-global__botao--secundario" onClick={cancelar}>{dialogo.cancelarTexto}</button>}
          <button ref={confirmarRef} type="button" className={`dialogo-global__botao ${dialogo.perigo ? "dialogo-global__botao--perigo" : "dialogo-global__botao--principal"}`} onClick={confirmar} disabled={dialogo.tipo === "entrada" && !valor.trim()}>{dialogo.confirmarTexto}</button>
        </footer>
      </section>
    </div>
  );
};

export default DialogoGlobal;

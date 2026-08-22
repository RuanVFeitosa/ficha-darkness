import React, { useState } from "react";
import Icon from "@mdi/react";
import {
  mdiAccountSearch,
  mdiAccountPlus,
  mdiBackspaceOutline,
  mdiClose,
  mdiShieldCrownOutline,
} from "@mdi/js";
import { buscarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import { MESTRE_AUTH_KEY, SENHA_MESTRE } from "../constants/masterAccess";
import "../CSS/TelaInicial.css";

const normalizarFichaId = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const TelaInicial = () => {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [painelMestreAberto, setPainelMestreAberto] = useState(false);
  const [senhaMestre, setSenhaMestre] = useState("");
  const [erroMestre, setErroMestre] = useState("");

  const adicionarDigitoFicha = (digito) => {
    setErro("");
    setCodigo((codigoAtual) => {
      if (codigoAtual.length >= 8) {
        return codigoAtual;
      }

      return `${codigoAtual}${digito}`;
    });
  };

  const apagarDigitoFicha = () => {
    setErro("");
    setCodigo((codigoAtual) => codigoAtual.slice(0, -1));
  };

  const entrar = async (event) => {
    event.preventDefault();
    setErro("");

    const fichaId = normalizarFichaId(codigo);

    if (!fichaId) {
      setErro("Informe o codigo da ficha.");
      return;
    }

    setEntrando(true);

    try {
      const personagem = await buscarPersonagem(fichaId);

      if (!personagem) {
        setErro("Nao encontrei uma ficha com esse codigo.");
        setEntrando(false);
        return;
      }

      localStorage.setItem(ULTIMA_FICHA_KEY, fichaId);
      window.location.href = `/?ficha=${encodeURIComponent(fichaId)}`;
    } catch (error) {
      setErro("Nao foi possivel entrar. Verifique se o backend esta rodando.");
      setEntrando(false);
    }
  };

  const abrirPainelMestre = () => {
    setSenhaMestre("");
    setErroMestre("");
    setPainelMestreAberto(true);
  };

  const fecharPainelMestre = () => {
    setPainelMestreAberto(false);
    setSenhaMestre("");
    setErroMestre("");
  };

  const adicionarDigitoMestre = (digito) => {
    setErroMestre("");
    setSenhaMestre((senhaAtual) => {
      if (senhaAtual.length >= SENHA_MESTRE.length) {
        return senhaAtual;
      }

      return `${senhaAtual}${digito}`;
    });
  };

  const apagarDigitoMestre = () => {
    setErroMestre("");
    setSenhaMestre((senhaAtual) => senhaAtual.slice(0, -1));
  };

  const confirmarSenhaMestre = () => {
    if (senhaMestre !== SENHA_MESTRE) {
      setErroMestre("Senha incorreta.");
      setSenhaMestre("");
      return;
    }

    sessionStorage.setItem(MESTRE_AUTH_KEY, "true");
    window.location.href = "/?mestre=1";
  };

  return (
    <main className="inicio-container">
      <section className="inicio-painel">
        <div className="inicio-dialogo">
          <p>Darkness</p>
          <h1>Identifique-se.</h1>
        </div>

        <form className="inicio-form" onSubmit={entrar}>
          <div className="inicio-codigo-area">
            <span>Codigo da ficha</span>

            <div className="inicio-codigo-display" aria-live="polite">
              {codigo || "Digite no painel"}
            </div>

            <div className="inicio-teclado" aria-label="Painel numerico da ficha">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                (digito) => (
                  <button
                    key={digito}
                    type="button"
                    onClick={() => adicionarDigitoFicha(digito)}
                  >
                    {digito}
                  </button>
                ),
              )}

              <button type="button" onClick={apagarDigitoFicha}>
                <Icon path={mdiBackspaceOutline} size={0.9} />
              </button>
              <button type="button" onClick={() => adicionarDigitoFicha("0")}>
                0
              </button>
              <button type="submit" className="inicio-teclado-confirmar">
                OK
              </button>
            </div>
          </div>

          {erro && <p className="inicio-erro">{erro}</p>}

          <div className="inicio-acoes">
            <button className="inicio-entrar" type="submit" disabled={entrando}>
              <Icon path={mdiAccountSearch} size={0.9} />
              {entrando ? "Entrando..." : "Entrar"}
            </button>

            <button
              className="inicio-cadastrar"
              type="button"
              onClick={() => {
                window.location.href = "/?criar=1";
              }}
            >
              <Icon path={mdiAccountPlus} size={0.9} />
              Cadastrar
            </button>

            <button
              className="inicio-mestre"
              type="button"
              onClick={abrirPainelMestre}
            >
              <Icon path={mdiShieldCrownOutline} size={0.9} />
              Mestre
            </button>
          </div>
        </form>
      </section>

      {painelMestreAberto && (
        <div className="mestre-senha-overlay" onClick={fecharPainelMestre}>
          <section
            className="mestre-senha-painel"
            aria-label="Senha da area do mestre"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mestre-senha-topo">
              <div>
                <span>Acesso restrito</span>
                <hr width="150%" />
                <h2>Area do Mestre</h2>
              </div>

              <button type="button" onClick={fecharPainelMestre}>
                <Icon path={mdiClose} size={0.85} />
              </button>
            </div>

            <div className="mestre-senha-display" aria-live="polite">
              {Array.from({ length: SENHA_MESTRE.length }).map((_, index) => (
                <span
                  key={index}
                  className={index < senhaMestre.length ? "preenchido" : ""}
                />
              ))}
            </div>

            {erroMestre && <p className="mestre-senha-erro">{erroMestre}</p>}

            <div className="mestre-teclado">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                (digito) => (
                  <button
                    key={digito}
                    type="button"
                    onClick={() => adicionarDigitoMestre(digito)}
                  >
                    {digito}
                  </button>
                ),
              )}

              <button type="button" onClick={apagarDigitoMestre}>
                <Icon path={mdiBackspaceOutline} size={0.9} />
              </button>
              <button type="button" onClick={() => adicionarDigitoMestre("0")}>
                0
              </button>
              <button
                type="button"
                className="mestre-teclado-confirmar"
                onClick={confirmarSenhaMestre}
              >
                OK
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default TelaInicial;

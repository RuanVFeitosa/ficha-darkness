import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountSearch, mdiAccountPlus } from "@mdi/js";
import { buscarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
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

  useEffect(() => {
    const ultimaFicha = localStorage.getItem(ULTIMA_FICHA_KEY);

    if (ultimaFicha) {
      window.location.href = `/?ficha=${encodeURIComponent(ultimaFicha)}`;
    }
  }, []);

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

  return (
    <main className="inicio-container">
      <section className="inicio-painel">
        <div className="inicio-dialogo">
          <p>Darkness</p>
          <h1>Identifique-se.</h1>
        </div>

        <form className="inicio-form" onSubmit={entrar}>
          <label>
            <span>Codigo da ficha</span>
            <input
              type="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              placeholder="ex: maria-sombria"
              autoFocus
            />
          </label>

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
          </div>
        </form>
      </section>
    </main>
  );
};

export default TelaInicial;

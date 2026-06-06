import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiAccountPlus, mdiChevronRight } from "@mdi/js";
import { criarPersonagem } from "../services/personagemApi";
import { ULTIMA_FICHA_KEY } from "../constants/session";
import { estadoInicial } from "./fichaPersonagem";
import "../CSS/CriarPersonagem.css";

const atributos = [
  { chave: "forca", nome: "Forca" },
  { chave: "fonitude", nome: "Fortitude" },
  { chave: "inteligencia", nome: "Inteligencia" },
  { chave: "reflexos", nome: "Reflexos" },
  { chave: "vontade", nome: "Vontade" },
];

const membrosIntegridade = [
  { chave: "cabeca", nome: "Cabeca" },
  { chave: "torso", nome: "Torso" },
  { chave: "bracoDireito", nome: "Braco direito" },
  { chave: "bracoEsquerdo", nome: "Braco esquerdo" },
  { chave: "pernaDireita", nome: "Perna direita" },
  { chave: "pernaEsquerda", nome: "Perna esquerda" },
];

// Escreva aqui o dialogo inicial antes das perguntas.
const dialogoInicial =
  "Antes de comecarmos, escute com atencao. Ainda ha espaco para mais palavras aqui.";

const perguntas = [
  "Como posso te chamar?",
  "Mostre-me sua Integridade.",
  "Por favor, insira as suas caracteristicas.",
  "Quais sao os seus titulos?",
  "Deixe-me ver seu rosto.",
];

const criarFichaInicial = (form) => ({
  ...estadoInicial,
  nome: form.nome.trim(),
  pronome: form.pronome,
  classe: form.classe.trim(),
  especialidade: form.especialidade.trim(),
  fotoPerfil: form.fotoPerfil,
  rituais: [],
  inventario: [],
  membros: Object.fromEntries(
    Object.entries(form.integridade).map(([membro, valor]) => [
      membro,
      {
        atual: valor,
        max: valor,
        ferido: false,
        grave: false,
      },
    ]),
  ),
  atributos: {
    ...estadoInicial.atributos,
    ...form.atributos,
  },
});

const CriarPersonagem = () => {
  const [etapa, setEtapa] = useState(0);
  const [textoVisivel, setTextoVisivel] = useState("");
  const [form, setForm] = useState({
    nome: "",
    pronome: "Ele",
    classe: "",
    especialidade: "",
    fotoPerfil: "",
    integridade: {
      cabeca: 100,
      torso: 500,
      bracoDireito: 500,
      bracoEsquerdo: 500,
      pernaDireita: 500,
      pernaEsquerda: 500,
    },
    atributos: {
      forca: 0,
      fonitude: 0,
      inteligencia: 0,
      reflexos: 0,
      vontade: 0,
    },
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const dialogoAtual =
    etapa === 0
      ? dialogoInicial
      : perguntas[etapa - 1] || "Tudo pronto. Agora podemos criar sua ficha.";
  const ultimaEtapa = etapa > perguntas.length;

  const etapaValida = useMemo(() => {
    if (etapa === 1) return form.nome.trim().length > 0;
    if (etapa === 4) {
      return (
        form.classe.trim().length > 0 && form.especialidade.trim().length > 0
      );
    }

    return true;
  }, [etapa, form.classe, form.especialidade, form.nome]);

  useEffect(() => {
    setTextoVisivel("");

    let indice = 0;
    const intervalo = window.setInterval(() => {
      indice += 1;
      setTextoVisivel(dialogoAtual.slice(0, indice));

      if (indice >= dialogoAtual.length) {
        window.clearInterval(intervalo);
      }
    }, 32);

    return () => window.clearInterval(intervalo);
  }, [dialogoAtual]);

  const atualizarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const atualizarAtributo = (atributo, valor) => {
    setForm((prev) => ({
      ...prev,
      atributos: {
        ...prev.atributos,
        [atributo]: Math.max(0, parseInt(valor) || 0),
      },
    }));
  };

  const atualizarIntegridade = (membro, valor) => {
    setForm((prev) => ({
      ...prev,
      integridade: {
        ...prev.integridade,
        [membro]: Math.max(0, parseInt(valor) || 0),
      },
    }));
  };

  const carregarFoto = (arquivo) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("Escolha uma imagem de ate 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      atualizarCampo("fotoPerfil", reader.result || "");
      setErro("");
    };
    reader.readAsDataURL(arquivo);
  };

  const proximaEtapa = () => {
    setErro("");

    if (!etapaValida) {
      setErro("Preencha os campos desta etapa para continuar.");
      return;
    }

    setEtapa((atual) => Math.min(atual + 1, perguntas.length + 1));
  };

  const voltarEtapa = () => {
    setErro("");
    setEtapa((atual) => Math.max(atual - 1, 0));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setErro("");

    if (!form.nome.trim()) {
      setErro("Informe o nome do personagem.");
      setEtapa(1);
      return;
    }

    setSalvando(true);

    try {
      const { fichaId } = await criarPersonagem(criarFichaInicial(form));
      localStorage.setItem(ULTIMA_FICHA_KEY, fichaId);
      window.location.href = `/?ficha=${encodeURIComponent(fichaId)}`;
    } catch (error) {
      setErro(
        `Nao foi possivel criar a ficha. ${error.message}`,
      );
      setSalvando(false);
    }
  };

  return (
    <main className="criacao-container">
      <form className="criacao-form" onSubmit={enviar}>
        <section className="criacao-dialogo">
          <p className="criacao-kicker">Voz desconhecida</p>
          <h1>{textoVisivel}</h1>
        </section>

        <section className="criacao-etapa">
          {etapa === 0 && (
            <div className="intro-etapa">
              <p>
                O dialogo inicial termina aqui. As perguntas comecam quando o
                jogador continuar.
              </p>
            </div>
          )}

          {etapa === 1 && (
            <div className="criacao-bloco identidade">
              <label>
                <span>Nome</span>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo("nome", event.target.value)
                  }
                  maxLength={30}
                  autoFocus
                />
              </label>

              <fieldset className="pronome-grupo">
                <legend>Pronome</legend>
                {["Ele", "Ela", "Elu"].map((pronome) => (
                  <label key={pronome}>
                    <input
                      type="radio"
                      name="pronome"
                      value={pronome}
                      checked={form.pronome === pronome}
                      onChange={(event) =>
                        atualizarCampo("pronome", event.target.value)
                      }
                    />
                    <span>{pronome}</span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {etapa === 2 && (
            <div className="criacao-integridade">
              {membrosIntegridade.map((membro) => (
                <label key={membro.chave}>
                  <span>{membro.nome}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.integridade[membro.chave]}
                    onChange={(event) =>
                      atualizarIntegridade(membro.chave, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {etapa === 3 && (
            <div className="criacao-atributos">
              {atributos.map((atributo) => (
                <label key={atributo.chave}>
                  <span>{atributo.nome}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.atributos[atributo.chave]}
                    onChange={(event) =>
                      atualizarAtributo(atributo.chave, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {etapa === 4 && (
            <div className="criacao-bloco titulos">
              <label>
                <span>Classe</span>
                <input
                  type="text"
                  value={form.classe}
                  onChange={(event) =>
                    atualizarCampo("classe", event.target.value)
                  }
                  maxLength={30}
                />
              </label>

              <label>
                <span>Especialidade</span>
                <input
                  type="text"
                  value={form.especialidade}
                  onChange={(event) =>
                    atualizarCampo("especialidade", event.target.value)
                  }
                  maxLength={40}
                />
              </label>
            </div>
          )}

          {etapa === 5 && (
            <div className="foto-etapa">
              <div className="foto-preview">
                {form.fotoPerfil ? (
                  <img src={form.fotoPerfil} alt="Rosto do personagem" />
                ) : (
                  <span>Sem rosto</span>
                )}
              </div>
              <label className="foto-upload">
                <span>Foto do personagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => carregarFoto(event.target.files?.[0])}
                />
              </label>
            </div>
          )}
        </section>

        {erro && <p className="criacao-erro">{erro}</p>}

        <div className="criacao-acoes">
          <button
            className="criacao-secundario"
            type="button"
            onClick={voltarEtapa}
            disabled={etapa === 0 || salvando}
          >
            Voltar
          </button>

          {ultimaEtapa ? (
            <button
              className="criacao-submit"
              type="submit"
              disabled={salvando}
            >
              <Icon path={mdiAccountPlus} size={0.9} />
              {salvando ? "Criando..." : "Criar ficha"}
            </button>
          ) : (
            <button
              className="criacao-submit"
              type="button"
              onClick={proximaEtapa}
              disabled={salvando}
            >
              <Icon path={mdiChevronRight} size={0.9} />
              Continuar
            </button>
          )}
        </div>
      </form>
    </main>
  );
};

export default CriarPersonagem;

import { supabase, supabaseConfigurado } from "./supabase";
import { iniciarPollingVisivel, SYNC_INTERVALS } from "./syncPolicy";

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, "");
  }

  const isCraDevServer = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  );

  if (isCraDevServer) {
    return "http://localhost:4000/api";
  }

  // Fallback de producao: a Vercel hospeda apenas o React e nao possui
  // funcoes /api neste projeto. A variavel de ambiente continua tendo
  // prioridade para permitir trocar o backend sem alterar o codigo.
  return "https://ficha-darkness-backend.onrender.com/api";
};

const API_URL = getApiUrl();

const request = async (path, options = {}) => {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const body = await response.text().catch(() => "");
    const preview = body.slice(0, 80).replace(/\s+/g, " ").trim();

    throw new Error(
      `Resposta nao-JSON da API em ${url}. Confira REACT_APP_API_URL na Vercel. Inicio da resposta: ${preview}`,
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.details || data?.error || `Erro na API: ${response.status}`,
    );
  }

  return response.json();
};

export const buscarPersonagem = async (fichaId) => {
  const data = await request(`/personagens/${encodeURIComponent(fichaId)}`);
  return data.personagem;
};

export const listarPersonagens = async () => {
  const data = await request("/personagens");
  return data.personagens || [];
};

export const criarPersonagem = async (personagem) => {
  return request("/personagens", {
    method: "POST",
    body: JSON.stringify(personagem),
  });
};

export const salvarPersonagem = async (fichaId, personagem) => {
  const data = await request(`/personagens/${encodeURIComponent(fichaId)}`, {
    method: "PUT",
    body: JSON.stringify(personagem),
  });

  const personagemSalvo = data.personagem;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("darkness:personagem-atualizado", {
      detail: { fichaId, personagem: personagemSalvo },
    }));
    try {
      const canal = new BroadcastChannel("darkness-personagens");
      canal.postMessage({ fichaId, personagem: personagemSalvo });
      canal.close();
    } catch {
      // BroadcastChannel pode estar indisponivel em navegadores antigos.
    }
  }
  return personagemSalvo;
};

export const ouvirPersonagens = (fichasIds, aoAtualizar) => {
  const ids = new Set((fichasIds || []).map(String));
  if (!ids.size || typeof aoAtualizar !== "function") return () => {};

  let ativo = true;
  let consultando = false;
  const revisoes = new Map();
  const receber = (mensagem) => {
    const fichaId = String(mensagem?.fichaId || mensagem?.id || "");
    const personagem = mensagem?.personagem;
    if (ativo && ids.has(fichaId) && personagem) {
      revisoes.set(fichaId, (revisoes.get(fichaId) || 0) + 1);
      aoAtualizar(fichaId, personagem);
    }
  };
  // A API também atende mesas cujo backend não usa Realtime do Supabase.
  const atualizarRemotos = async () => {
    if (!ativo || consultando) return;
    consultando = true;
    try {
      await Promise.all([...ids].map(async (fichaId) => {
        const revisao = revisoes.get(fichaId) || 0;
        try {
          const personagem = await buscarPersonagem(fichaId);
          if (ativo && revisao === (revisoes.get(fichaId) || 0)) receber({ fichaId, personagem });
        } catch {
          // Mantém a última aparência recebida e tenta novamente no próximo ciclo.
        }
      }));
    } finally {
      consultando = false;
    }
  };
  const pararPolling = iniciarPollingVisivel(atualizarRemotos, SYNC_INTERVALS.mesaPersonagens);
  atualizarRemotos();
  const eventoLocal = (evento) => receber(evento.detail);
  window.addEventListener("darkness:personagem-atualizado", eventoLocal);

  let canalNavegador;
  try {
    canalNavegador = new BroadcastChannel("darkness-personagens");
    canalNavegador.onmessage = (evento) => receber(evento.data);
  } catch {
    canalNavegador = null;
  }

  const canalSupabase = supabaseConfigurado
    ? supabase.channel(`personagens-mesa-${ids.size}-${Date.now()}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "personagens" },
      (evento) => receber(evento.new),
    ).subscribe()
    : null;

  return () => {
    ativo = false;
    pararPolling();
    window.removeEventListener("darkness:personagem-atualizado", eventoLocal);
    canalNavegador?.close();
    if (canalSupabase) supabase.removeChannel(canalSupabase);
  };
};

export const apagarPersonagem = async (fichaId) => {
  return request(`/personagens/${encodeURIComponent(fichaId)}`, {
    method: "DELETE",
  });
};

export const buscarCatalogoLoja = async () => {
  const data = await request("/loja/catalogo");
  return data.catalogo || [];
};

export const salvarCatalogoLoja = async (catalogo) => {
  const data = await request("/loja/catalogo", {
    method: "PUT",
    body: JSON.stringify({ catalogo }),
  });

  return data.catalogo || [];
};

export const buscarArvoresHabilidades = async () => {
  const data = await request("/arvores-habilidades");
  return data.arvores || {};
};

export const salvarArvoresHabilidades = async (arvores) => {
  const data = await request("/arvores-habilidades", {
    method: "PUT",
    body: JSON.stringify({ arvores }),
  });

  return data.arvores || {};
};

export const buscarDestinos = async () => (await request("/destinos")).destinos || [];
export const salvarDestinos = async (destinos) => (await request("/destinos", {
  method: "PUT", body: JSON.stringify({ destinos }),
})).destinos;

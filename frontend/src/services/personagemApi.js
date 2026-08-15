const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, "");
  }

  const isCraDevServer =
    window.location.hostname === "localhost" && window.location.port === "3000";

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

  return data.personagem;
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

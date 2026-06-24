const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const isCraDevServer =
    window.location.hostname === "localhost" && window.location.port === "3000";

  return isCraDevServer ? "http://localhost:4000/api" : "/api";
};

const API_URL = getApiUrl();

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

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

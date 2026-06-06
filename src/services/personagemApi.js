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
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
};

export const buscarPersonagem = async (fichaId) => {
  const data = await request(`/personagens/${encodeURIComponent(fichaId)}`);
  return data.personagem;
};

export const criarPersonagem = async (personagem) => {
  const data = await request("/personagens", {
    method: "POST",
    body: JSON.stringify(personagem),
  });

  return data;
};

export const salvarPersonagem = async (fichaId, personagem) => {
  const data = await request(`/personagens/${encodeURIComponent(fichaId)}`, {
    method: "PUT",
    body: JSON.stringify(personagem),
  });

  return data.personagem;
};

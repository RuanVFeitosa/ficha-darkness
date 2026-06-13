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

export const criarParty = async (fichaId, personagem) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({ fichaId, personagem }),
  });

  return data.party;
};

export const buscarParty = async (partyCode) => {
  const data = await request(`/parties?code=${encodeURIComponent(partyCode)}`);
  return data.party;
};

export const entrarParty = async (partyCode, fichaId, personagem) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({
      action: "join",
      code: partyCode,
      fichaId,
      personagem,
    }),
  });

  return data.party;
};

export const atualizarStatusParty = async (partyCode, fichaId, personagem) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({
      action: "status",
      code: partyCode,
      fichaId,
      personagem,
    }),
  });

  return data.party;
};

export const enviarNotaParty = async (partyCode, fichaId, texto) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({
      action: "note",
      code: partyCode,
      fichaId,
      texto,
    }),
  });

  return data.party;
};

export const enviarRolagemParty = async (partyCode, fichaId, roll) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({
      action: "roll",
      code: partyCode,
      fichaId,
      roll,
    }),
  });

  return data.party;
};

export const transferirItemParty = async (
  partyCode,
  fromFichaId,
  toFichaId,
  itemIndex,
) => {
  const data = await request("/parties", {
    method: "POST",
    body: JSON.stringify({
      action: "item",
      code: partyCode,
      fromFichaId,
      toFichaId,
      itemIndex,
    }),
  });

  return data.party;
};

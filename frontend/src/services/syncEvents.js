export const PERSONAGEM_SYNC_EVENT = "darkness:personagem-sync";
export const ARVORES_SYNC_EVENT = "darkness:arvores-sync";

const PERSONAGEM_SYNC_KEY = "darkness_sync_personagem";
const ARVORES_SYNC_KEY = "darkness_sync_arvores";
const ABA_SYNC_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const publicarStorage = (chave, payload) => {
  try {
    localStorage.setItem(
      chave,
      JSON.stringify({
        ...payload,
        origem: ABA_SYNC_ID,
        sincronizadoEm: Date.now(),
      }),
    );
  } catch (error) {
    console.warn("Nao foi possivel publicar sincronizacao local.", error);
  }
};

export const notificarPersonagemAtualizado = (fichaId, personagem) => {
  const detail = { fichaId, personagem, origem: ABA_SYNC_ID };

  window.dispatchEvent(new CustomEvent(PERSONAGEM_SYNC_EVENT, { detail }));
  publicarStorage(PERSONAGEM_SYNC_KEY, { fichaId });
};

export const notificarArvoresAtualizadas = (arvores) => {
  const detail = { arvores, origem: ABA_SYNC_ID };

  window.dispatchEvent(new CustomEvent(ARVORES_SYNC_EVENT, { detail }));
  publicarStorage(ARVORES_SYNC_KEY, {});
};

export const ouvirPersonagemAtualizado = (callback) => {
  const aoSincronizar = (event) => {
    if (event.detail?.origem === ABA_SYNC_ID) return;
    callback(event.detail || {});
  };
  const aoStorage = (event) => {
    if (event.key !== PERSONAGEM_SYNC_KEY || !event.newValue) return;

    try {
      const payload = JSON.parse(event.newValue);
      if (payload?.origem === ABA_SYNC_ID) return;
      callback(payload);
    } catch {
      callback({});
    }
  };

  window.addEventListener(PERSONAGEM_SYNC_EVENT, aoSincronizar);
  window.addEventListener("storage", aoStorage);

  return () => {
    window.removeEventListener(PERSONAGEM_SYNC_EVENT, aoSincronizar);
    window.removeEventListener("storage", aoStorage);
  };
};

export const ouvirArvoresAtualizadas = (callback) => {
  const aoSincronizar = (event) => {
    if (event.detail?.origem === ABA_SYNC_ID) return;
    callback(event.detail || {});
  };
  const aoStorage = (event) => {
    if (event.key !== ARVORES_SYNC_KEY) return;
    try {
      const payload = event.newValue ? JSON.parse(event.newValue) : {};
      if (payload?.origem === ABA_SYNC_ID) return;
    } catch {
      // Se o payload estiver ilegivel, ainda tentamos sincronizar.
    }
    callback({});
  };

  window.addEventListener(ARVORES_SYNC_EVENT, aoSincronizar);
  window.addEventListener("storage", aoStorage);

  return () => {
    window.removeEventListener(ARVORES_SYNC_EVENT, aoSincronizar);
    window.removeEventListener("storage", aoStorage);
  };
};

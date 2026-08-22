import { supabase, supabaseConfigurado } from "./supabase";

const chaveLocal = (campanhaId) => `darkness_anotacoes_${campanhaId}`;
const lerLocais = (campanhaId) => {
  try { return JSON.parse(localStorage.getItem(chaveLocal(campanhaId))) || []; }
  catch { return []; }
};
const salvarLocais = (campanhaId, notas) => localStorage.setItem(chaveLocal(campanhaId), JSON.stringify(notas));
const chavePastas = (campanhaId) => `darkness_anotacoes_pastas_${campanhaId}`;
const lerPastasLocais = (campanhaId) => { try { return JSON.parse(localStorage.getItem(chavePastas(campanhaId))) || []; } catch { return []; } };
const tabelaAusente = (error) => error?.code === "42P01" || /pastas_anotacoes.*(not exist|schema cache)/i.test(error?.message || "");
const criarPastaLocal = (campanhaId, nome) => {
  const pastas = lerPastasLocais(campanhaId);
  const existente = pastas.find((item) => item.nome.toLowerCase() === nome.toLowerCase());
  if (existente) return existente;
  const pasta = { id: `pasta-${Date.now()}`, campanha_id: campanhaId, nome };
  localStorage.setItem(chavePastas(campanhaId), JSON.stringify([...pastas, pasta])); return pasta;
};

export const listarAnotacoes = async (campanhaId) => {
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) return lerLocais(campanhaId);
  const { data, error } = await supabase.from("anotacoes_campanha").select("*").eq("campanha_id", campanhaId).order("atualizado_em", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const salvarAnotacao = async (campanhaId, nota) => {
  const agora = new Date().toISOString();
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    const notas = lerLocais(campanhaId);
    const registro = { ...nota, id: nota.id || `nota-${Date.now()}`, campanha_id: campanhaId, atualizado_em: agora, criado_em: nota.criado_em || agora };
    salvarLocais(campanhaId, notas.some((item) => item.id === registro.id) ? notas.map((item) => item.id === registro.id ? registro : item) : [registro, ...notas]);
    return registro;
  }
  const payload = { ...(nota.id ? { id: nota.id } : {}), campanha_id: campanhaId, titulo: nota.titulo || "Sem titulo", pasta: nota.pasta || "Notas", conteudo: nota.conteudo || "", atualizado_em: agora };
  const { data, error } = await supabase.from("anotacoes_campanha").upsert(payload).select().single();
  if (error) throw error;
  return data;
};

export const excluirAnotacao = async (campanhaId, notaId) => {
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    salvarLocais(campanhaId, lerLocais(campanhaId).filter((item) => item.id !== notaId));
    return;
  }
  const { error } = await supabase.from("anotacoes_campanha").delete().eq("id", notaId).eq("campanha_id", campanhaId);
  if (error) throw error;
};

export const listarPastasAnotacoes = async (campanhaId) => {
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) return lerPastasLocais(campanhaId);
  const { data, error } = await supabase.from("pastas_anotacoes").select("*").eq("campanha_id", campanhaId).order("nome");
  if (error) { if (tabelaAusente(error)) return lerPastasLocais(campanhaId); throw error; } return data || [];
};

export const criarPastaAnotacoes = async (campanhaId, nome) => {
  const nomeLimpo = String(nome || "").trim();
  if (!nomeLimpo) throw new Error("Digite um nome para a pasta.");
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    return criarPastaLocal(campanhaId, nomeLimpo);
  }
  const { data, error } = await supabase.from("pastas_anotacoes").insert({ campanha_id: campanhaId, nome: nomeLimpo }).select().single();
  if (error) { if (tabelaAusente(error)) return criarPastaLocal(campanhaId, nomeLimpo); throw error; } return data;
};

export const renomearPastaAnotacoes = async (campanhaId, pasta, novoNome) => {
  const nome = String(novoNome || "").trim();
  if (!nome) throw new Error("Digite um nome para a pasta.");
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    localStorage.setItem(chavePastas(campanhaId), JSON.stringify(lerPastasLocais(campanhaId).map((item) => item.id === pasta.id ? { ...item, nome } : item)));
    salvarLocais(campanhaId, lerLocais(campanhaId).map((nota) => nota.pasta === pasta.nome ? { ...nota, pasta: nome } : nota));
    return { ...pasta, nome };
  }
  if (String(pasta.id).startsWith("pasta-")) {
    localStorage.setItem(chavePastas(campanhaId), JSON.stringify(lerPastasLocais(campanhaId).map((item) => item.id === pasta.id ? { ...item, nome } : item)));
    const { error } = await supabase.from("anotacoes_campanha").update({ pasta: nome }).eq("campanha_id", campanhaId).eq("pasta", pasta.nome);
    if (error) throw error; return { ...pasta, nome };
  }
  const { error: erroNotas } = await supabase.from("anotacoes_campanha").update({ pasta: nome }).eq("campanha_id", campanhaId).eq("pasta", pasta.nome);
  if (erroNotas) throw erroNotas;
  const { data, error } = await supabase.from("pastas_anotacoes").update({ nome }).eq("id", pasta.id).eq("campanha_id", campanhaId).select().single();
  if (error) throw error; return data;
};

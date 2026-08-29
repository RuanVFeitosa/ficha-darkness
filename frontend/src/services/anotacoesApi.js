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
const tabelaAnotacoesAusente = (error) =>
  error?.code === "42P01" ||
  /anotacoes_campanha.*(not exist|schema cache|could not find)/i.test(
    error?.message || "",
  );
const colunasDocumentoAusentes = (error) =>
  /documento_(url|nome|tipo).*?(not exist|schema cache|could not find)/i.test(
    error?.message || "",
  ) ||
  /could not find.*documento_(url|nome|tipo)/i.test(error?.message || "");
const payloadSemDocumento = ({ documento_url, documento_nome, documento_tipo, ...payload }) => payload;
const criarPastaLocal = (campanhaId, nome) => {
  const pastas = lerPastasLocais(campanhaId);
  const existente = pastas.find((item) => item.nome.toLowerCase() === nome.toLowerCase());
  if (existente) return existente;
  const pasta = { id: `pasta-${Date.now()}`, campanha_id: campanhaId, nome };
  localStorage.setItem(chavePastas(campanhaId), JSON.stringify([...pastas, pasta])); return pasta;
};
const salvarAnotacaoLocal = (campanhaId, nota) => {
  const agora = new Date().toISOString();
  const notas = lerLocais(campanhaId);
  const registro = {
    ...nota,
    id: nota.id || `nota-${Date.now()}`,
    campanha_id: campanhaId,
    atualizado_em: agora,
    criado_em: nota.criado_em || agora,
  };
  salvarLocais(
    campanhaId,
    notas.some((item) => item.id === registro.id)
      ? notas.map((item) => item.id === registro.id ? registro : item)
      : [registro, ...notas],
  );
  return registro;
};

export const listarAnotacoes = async (campanhaId) => {
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) return lerLocais(campanhaId);
  const { data, error } = await supabase.from("anotacoes_campanha").select("*").eq("campanha_id", campanhaId).order("atualizado_em", { ascending: false });
  if (error) {
    if (tabelaAnotacoesAusente(error)) return lerLocais(campanhaId);
    throw error;
  }
  return data || [];
};

export const salvarAnotacao = async (campanhaId, nota) => {
  const agora = new Date().toISOString();

  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    return salvarAnotacaoLocal(campanhaId, nota);
  }

  const payload = {
    campanha_id: campanhaId,
    titulo: nota.titulo || "Sem titulo",
    pasta: nota.pasta || "Notas",
    conteudo: nota.conteudo || "",
    atualizado_em: agora,
    documento_url: nota.documento_url || null,
    documento_nome: nota.documento_nome || null,
    documento_tipo: nota.documento_tipo || null,
  };

  // NOTA EXISTENTE → UPDATE
  if (nota.id) {
    let { data, error } = await supabase
      .from("anotacoes_campanha")
      .update(payload)
      .eq("id", nota.id)
      .eq("campanha_id", campanhaId)
      .select()
      .single();

    if (error && colunasDocumentoAusentes(error)) {
      ({ data, error } = await supabase
        .from("anotacoes_campanha")
        .update(payloadSemDocumento(payload))
        .eq("id", nota.id)
        .eq("campanha_id", campanhaId)
        .select()
        .single());
    }

    if (error) {
      if (tabelaAnotacoesAusente(error))
        return salvarAnotacaoLocal(campanhaId, nota);
      console.error("Erro ao atualizar anotação:", error);
      throw error;
    }

    return data;
  }

  // NOVA NOTA → INSERT
  let { data, error } = await supabase
    .from("anotacoes_campanha")
    .insert(payload)
    .select()
    .single();

  if (error && colunasDocumentoAusentes(error)) {
    ({ data, error } = await supabase
      .from("anotacoes_campanha")
      .insert(payloadSemDocumento(payload))
      .select()
      .single());
  }

  if (error) {
    if (tabelaAnotacoesAusente(error))
      return salvarAnotacaoLocal(campanhaId, nota);
    console.error("Erro ao criar anotação:", error);
    throw error;
  }

  return data;
};

export const enviarDocumentoAnotacao = async (campanhaId, arquivo) => {
  const permitidos = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!permitidos.includes(arquivo?.type)) throw new Error("Selecione um arquivo PDF, DOC ou DOCX.");
  if (arquivo.size > 25 * 1024 * 1024) throw new Error("O arquivo deve ter no maximo 25 MB.");

  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    return { url: URL.createObjectURL(arquivo), nome: arquivo.name, tipo: arquivo.type, temporario: true };
  }

  const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const caminho = `${campanhaId}/${Date.now()}-${nomeSeguro}`;
  const { error } = await supabase.storage.from("documentos-campanha").upload(caminho, arquivo, { upsert: false, contentType: arquivo.type });
  if (error) throw error;
  const url = supabase.storage.from("documentos-campanha").getPublicUrl(caminho).data.publicUrl;
  return { url, nome: arquivo.name, tipo: arquivo.type };
};

export const excluirAnotacao = async (campanhaId, notaId) => {
  if (!supabaseConfigurado || String(campanhaId).startsWith("demo")) {
    salvarLocais(campanhaId, lerLocais(campanhaId).filter((item) => item.id !== notaId));
    return;
  }
  const { error } = await supabase.from("anotacoes_campanha").delete().eq("id", notaId).eq("campanha_id", campanhaId);
  if (error) {
    if (tabelaAnotacoesAusente(error)) {
      salvarLocais(campanhaId, lerLocais(campanhaId).filter((item) => item.id !== notaId));
      return;
    }
    throw error;
  }
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

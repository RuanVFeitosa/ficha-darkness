const formatos = {
  mp3: "audio/mpeg", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg",
  wav: "audio/wav", webm: "audio/webm", m4a: "audio/mp4", mp4: "audio/mp4",
  aac: "audio/aac", flac: "audio/flac",
};
const aliases = {
  "audio/mp3": "audio/mpeg", "audio/x-mp3": "audio/mpeg",
  "audio/x-wav": "audio/wav", "audio/wave": "audio/wav", "audio/vnd.wave": "audio/wav",
  "audio/x-m4a": "audio/mp4", "audio/m4a": "audio/mp4",
  "audio/x-flac": "audio/flac", "audio/x-aac": "audio/aac",
  "audio/opus": "audio/ogg", "application/ogg": "audio/ogg",
};
export const ACEITAR_AUDIO = [...Object.keys(formatos).map((ext) => `.${ext}`), ...new Set(Object.values(formatos)), ...Object.keys(aliases)].join(",");

export const tipoAudioUpload = (arquivo) => {
  const mime = (arquivo?.type || "").toLowerCase().split(";")[0].trim();
  if (aliases[mime]) return aliases[mime];
  if (Object.values(formatos).includes(mime)) return mime;
  if (!mime || mime === "application/octet-stream") {
    return formatos[arquivo?.name?.split(".").pop()?.toLowerCase()] || null;
  }
  return null;
};

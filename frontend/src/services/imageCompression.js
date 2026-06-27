const MAX_PROFILE_IMAGE_SIZE = 512;
const PROFILE_IMAGE_QUALITY = 0.72;
const MAX_PROFILE_IMAGE_BYTES = 120 * 1024;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    image.src = src;
  });

const canvasToDataUrl = (canvas, type, quality) =>
  new Promise((resolve) => {
    if (!canvas.toBlob) {
      resolve(canvas.toDataURL(type, quality));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL(type, quality));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      },
      type,
      quality,
    );
  });

const getDataUrlBytes = (dataUrl) => {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

export const compressProfileImage = async (file) => {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem valido.");
  }

  const originalDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem."));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(originalDataUrl);
  const ratio = Math.min(
    1,
    MAX_PROFILE_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#111";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = PROFILE_IMAGE_QUALITY;
  let dataUrl = await canvasToDataUrl(canvas, "image/jpeg", quality);

  while (getDataUrlBytes(dataUrl) > MAX_PROFILE_IMAGE_BYTES && quality > 0.42) {
    quality -= 0.08;
    dataUrl = await canvasToDataUrl(canvas, "image/jpeg", quality);
  }

  return dataUrl;
};

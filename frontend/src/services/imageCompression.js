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
  const preservesTransparency = !["image/jpeg", "image/jpg"].includes(
    String(file.type || "").toLowerCase(),
  );
  const outputType = preservesTransparency ? "image/webp" : "image/jpeg";
  const context = canvas.getContext("2d", { alpha: preservesTransparency });

  canvas.width = width;
  canvas.height = height;
  if (!preservesTransparency) {
    context.fillStyle = "#111";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  let quality = PROFILE_IMAGE_QUALITY;
  let dataUrl = await canvasToDataUrl(canvas, outputType, quality);

  while (getDataUrlBytes(dataUrl) > MAX_PROFILE_IMAGE_BYTES && quality > 0.42) {
    quality -= 0.08;
    dataUrl = await canvasToDataUrl(canvas, outputType, quality);
  }

  return dataUrl;
};

const getVisibleBounds = (context, width, height) => {
  const { data } = context.getImageData(0, 0, width, height);
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < 8) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  return right >= left && bottom >= top
    ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
    : { x: 0, y: 0, width, height };
};

export const prepareTokenImage = async (file) => {
  if (!file?.type?.startsWith("image/")) throw new Error("Escolha um arquivo PNG, JPG ou WebP válido.");
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem do token."));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(source);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth; sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext("2d", { alpha: true, willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const bounds = getVisibleBounds(sourceContext, sourceCanvas.width, sourceCanvas.height);
  const ratio = Math.min(1, 768 / Math.max(bounds.width, bounds.height));
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(bounds.width * ratio));
  output.height = Math.max(1, Math.round(bounds.height * ratio));
  output.getContext("2d", { alpha: true }).drawImage(sourceCanvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, output.width, output.height);
  return canvasToDataUrl(output, "image/webp", 0.82);
};
export const compressBackgroundImage = async (file) => {
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
    1600 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#f4f3ef";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.78;
  let dataUrl = await canvasToDataUrl(canvas, "image/jpeg", quality);
  while (getDataUrlBytes(dataUrl) > 420 * 1024 && quality > 0.38) {
    quality -= 0.08;
    dataUrl = await canvasToDataUrl(canvas, "image/jpeg", quality);
  }
  if (getDataUrlBytes(dataUrl) > 600 * 1024) {
    throw new Error("A imagem continua muito grande após a compressão. Escolha outra imagem.");
  }
  return dataUrl;
};

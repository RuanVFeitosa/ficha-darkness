import { compressProfileImage } from '../services/imageCompression';

export async function prepararFotoPerfil(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('Escolha uma imagem PNG, JPG ou WebP de até 5 MB.');
  }
  return compressProfileImage(file);
}

/**
 * Centralized Image Utility Handler
 * Provides image compression, resizing, MIME validation, format conversion, and URL detection.
 */

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/gif'
];

/**
 * Checks if string is a Base64 encoded image or media string
 */
export function isBase64Image(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('data:image/') || value.startsWith('data:video/') || value.startsWith('data:');
}

/**
 * Resolves image source for <img> tags. Returns base64 or URL as-is.
 */
export function resolveImageSource(value: string | null | undefined, fallback = ''): string {
  if (!value) return fallback;
  return value;
}

/**
 * Validates image file MIME type and size.
 */
export function validateImageFile(file: File, maxMb = 30): void {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido.');
  }

  // Check type (allowing image/ or video/ or files with valid image extensions on Android/iOS/Safari)
  const fileName = file.name || '';
  const hasImageExtension = /\.(jpe?g|png|webp|heic|heif|gif|bmp|svg|mp4|mov)$/i.test(fileName);
  const isImageOrVideo = (file.type && (file.type.startsWith('image/') || file.type.startsWith('video/'))) || hasImageExtension;
  
  if (!isImageOrVideo && file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    if (!hasImageExtension) {
      throw new Error(`Formato não suportado: ${file.type}. Formatos permitidos: JPG, PNG, WEBP, HEIC.`);
    }
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). O tamanho máximo permitido é ${maxMb}MB.`);
  }
}

/**
 * Resizes an image file and produces a compressed Data URL (Base64).
 * Uses hardware-accelerated createImageBitmap when available for instantaneous processing on mobile.
 */
export async function resizeImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.65): Promise<string> {
  validateImageFile(file);

  // Modern browsers / Android / iOS: Use native hardware-accelerated decoding
  if (typeof createImageBitmap === 'function' && file.type !== 'image/svg+xml') {
    try {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', quality);
      }
    } catch (bitmapErr) {
      console.warn('createImageBitmap fallback to FileReader:', bitmapErr);
    }
  }

  // Robust fallback using FileReader and Image with safety timeout
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Tempo limite esgotado ao ler imagem.'));
    }, 10000);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Falha ao processar canvas da imagem.'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Erro ao decodificar imagem.'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Erro ao carregar arquivo de foto.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates, resizes, compresses an image file and produces a Blob for Firebase Storage upload.
 */
export function prepareImageForUpload(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      validateImageFile(file);
    } catch (err) {
      return reject(err);
    }

    // If file is non-image (e.g. video), return original file blob
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Falha ao obter contexto 2D do canvas.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao converter imagem para Blob.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Downloads or converts an HTTP URL / Data URL image to Base64 in memory (used for PDF generation).
 */
export async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  if (isBase64Image(imageUrl)) return imageUrl;

  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading image as base64 from URL:", imageUrl, e);
    return '';
  }
}

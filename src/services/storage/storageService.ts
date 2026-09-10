import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { prepareImageForUpload, resizeImage } from '../../lib/imageHandler';

/**
 * Generates a unique filename preserving extension or defaulting to .jpg
 */
function generateUniqueFileName(file?: File): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  let ext = 'jpg';
  if (file && file.name) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      ext = parts.pop()?.toLowerCase() || 'jpg';
    }
  }
  return `${timestamp}_${randomStr}.${ext}`;
}

export const storageService = {
  /**
   * Uploads a File or Blob to Firebase Storage and returns its public download URL.
   */
  async uploadFile(blobOrFile: Blob | File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, blobOrFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error: any) {
      console.error(`[StorageService] Upload error at path "${path}":`, error);
      throw new Error(`Falha no upload da imagem: ${error.message || 'Erro desconhecido'}`);
    }
  },

  /**
   * Prepares (resizes/compresses) an image and uploads it to Firebase Storage.
   * When Firebase Storage is unavailable, unconfigured, or throws permission/storage errors,
   * it seamlessly falls back to returning a high-efficiency compressed Data URL (Base64).
   */
  async prepareAndUploadImage(
    file: File,
    storagePathFolder: string,
    maxWidth = 900,
    maxHeight = 900,
    quality = 0.72
  ): Promise<string> {
    try {
      const processedBlob = await prepareImageForUpload(file, maxWidth, maxHeight, quality);
      const fileName = generateUniqueFileName(file);
      const fullPath = `${storagePathFolder}/${fileName}`;
      
      try {
        const downloadUrl = await this.uploadFile(processedBlob, fullPath);
        return downloadUrl;
      } catch (storageError: any) {
        console.warn(`[StorageService] Firebase Storage indisponível (${storageError?.message || 'Storage desativado'}). Convertendo imagem com compressão direta para Base64...`);
        
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string);
            } else {
              reject(new Error('Falha ao converter imagem para exibição'));
            }
          };
          reader.onerror = () => reject(new Error('Erro ao ler imagem processada'));
          reader.readAsDataURL(processedBlob);
        });
      }
    } catch (err: any) {
      console.warn('[StorageService] Processamento padrão de imagem falhou, usando fallback direto via resizeImage:', err);
      return await resizeImage(file, maxWidth, maxHeight, quality);
    }
  },

  /**
   * Helper path generator for Service Orders photos (Before/After)
   */
  getServiceOrderPath(userId: string, orderId: string, type: 'before' | 'after' | string = 'before'): string {
    return `users/${userId}/service-orders/${orderId}/${type}`;
  },

  /**
   * Helper path generator for Quotes photos
   */
  getQuotePath(userId: string, quoteId: string): string {
    return `users/${userId}/quotes/${quoteId}`;
  },

  /**
   * Helper path generator for Portfolio items
   */
  getPortfolioPath(userId: string, portfolioId: string): string {
    return `users/${userId}/portfolio/${portfolioId}`;
  },

  /**
   * Helper path generator for Category covers
   */
  getCategoryCoverPath(userId: string, categoryId: string): string {
    return `users/${userId}/categories/${categoryId}`;
  },

  /**
   * Attempts to delete a file from storage given its download URL or path.
   * Fails gracefully if file is not found or is a Base64 string.
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.includes('firebasestorage.googleapis.com')) {
      return; // Not a Firebase Storage URL or already Base64
    }
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn('[StorageService] Error deleting file (ignored):', error);
    }
  }
};

import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { OperationType, handleFirestoreError } from '../../../../lib/error';
import { storageService } from '../../../../services/storage/storageService';
import { PortfolioItem } from '../types/portfolio.types';

export const portfolioService = {
  subscribeToPortfolio(
    userId: string,
    onSuccess: (items: PortfolioItem[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const q = query(collection(db, 'portfolio'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PortfolioItem[];
        onSuccess(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'portfolio');
        if (onError) onError(err);
      }
    );
  },

  subscribeToCategoryImages(
    onSuccess: (images: Record<string, string>) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'site_settings', 'categories'),
      (docSnap) => {
        if (docSnap.exists()) {
          onSuccess(docSnap.data().images || {});
        } else {
          onSuccess({});
        }
      },
      (err) => {
        console.error('Error loading category images:', err);
      }
    );
  },

  async updateCategoryPhoto(
    userId: string,
    categoryId: string,
    file: File
  ): Promise<string> {
    const folderPath = storageService.getCategoryCoverPath(userId, categoryId);
    const downloadUrl = await storageService.prepareAndUploadImage(
      file,
      folderPath,
      800,
      600
    );

    const docRef = doc(db, 'site_settings', 'categories');
    try {
      await updateDoc(docRef, {
        [`images.${categoryId}`]: downloadUrl,
      });
    } catch (e: any) {
      if (
        e.code === 'not-found' ||
        e.message?.includes('No document to update')
      ) {
        await setDoc(docRef, { userId, images: { [categoryId]: downloadUrl } }, { merge: true });
      } else {
        throw e;
      }
    }

    return downloadUrl;
  },

  async uploadProjectImage(
    userId: string,
    editingId: string | null,
    file: File
  ): Promise<string> {
    const folderPath = storageService.getPortfolioPath(
      userId,
      editingId || 'draft'
    );
    return await storageService.prepareAndUploadImage(
      file,
      folderPath,
      1200,
      1200
    );
  },

  async savePortfolioItem(
    editingId: string | null,
    userId: string,
    docData: any
  ): Promise<void> {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'portfolio', editingId), docData);
      } else {
        await addDoc(collection(db, 'portfolio'), {
          ...docData,
          userId,
          createdAt: Date.now(),
        });
      }
    } catch (err: any) {
      handleFirestoreError(
        err,
        editingId ? OperationType.UPDATE : OperationType.CREATE,
        'portfolio'
      );
      throw err;
    }
  },

  async toggleVisibility(id: string, currentIsPublic: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'portfolio', id), {
        isPublic: !currentIsPublic,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'portfolio');
      throw err;
    }
  },

  async deletePortfolioItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, 'portfolio');
      throw err;
    }
  },
};

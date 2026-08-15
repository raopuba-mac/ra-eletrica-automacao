export interface PortfolioItem {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  category?: string;
  photoUrl?: string | null;
  mediaUrls?: string[];
  isPublic: boolean;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface PortfolioFormData {
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export interface Book {
  id: string;
  name: string;
  description?: string;
  color?: string;
  emoji?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

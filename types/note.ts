export interface NoteCategory {
  categoryId: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  createdAt?: string;
}

export interface Note {
  noteId: string;
  title: string;
  content: string;
  categoryId: string;
  category: NoteCategory;
  isPinned: boolean;
  folderId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteListItem {
  noteId: string;
  title: string;
  preview: string;
  category: NoteCategory;
  timestamp: string;
  isPinned: boolean;
}

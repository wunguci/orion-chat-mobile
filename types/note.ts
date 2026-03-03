export type NoteCategory = 'finance' | 'sport' | 'personal' | 'work';

export interface Note {
    id: string;
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface NoteListItem {
    id: string;
    title: string;
    preview: string;
    category: NoteCategory;
    timestamp: string;
    isPinned: boolean;
}
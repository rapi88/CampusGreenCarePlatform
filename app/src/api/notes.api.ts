import { api } from './axios';

export interface TreeNote {
  id: string;
  treeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export const notesApi = {
  getNotes: (treeId: string) => api.get<TreeNote[]>(`/trees/${treeId}/notes`),
  addNote: (treeId: string, text: string) =>
    api.post<TreeNote>(`/trees/${treeId}/notes`, { text }),
  deleteNote: (treeId: string, noteId: string) =>
    api.delete(`/trees/${treeId}/notes/${noteId}`),
};

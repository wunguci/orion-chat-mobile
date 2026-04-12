import API_BASE_URL from "@/config/api";
import type { Note, NoteCategory } from "@/types/note";
import AsyncStorage from "@react-native-async-storage/async-storage";

const buildUrl = (
  path: string,
  params?: Record<string, string | undefined>,
) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
};

const getAuthToken = async () => {
  const tokenCandidates = [
    await AsyncStorage.getItem("auth_token"),
    await AsyncStorage.getItem("token"),
    await AsyncStorage.getItem("accessToken"),
  ];

  return tokenCandidates.find((item) => !!item) || null;
};

const authFetch = async (url: string, init?: RequestInit) => {
  const token = await getAuthToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers,
  });
};

export const noteApi = {
  getAll: async (params?: {
    categoryId?: string;
    search?: string;
    isPinned?: boolean;
    skip?: number;
    take?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.categoryId) query.categoryId = params.categoryId;
    if (params?.search) query.search = params.search;
    if (params?.isPinned !== undefined)
      query.isPinned = String(params.isPinned);
    if (params?.skip !== undefined) query.skip = String(params.skip);
    if (params?.take !== undefined) query.take = String(params.take);

    const response = await authFetch(buildUrl("/notes", query));
    return toJson<{ notes: Note[]; total: number }>(response);
  },

  getOne: async (noteId: string) => {
    const response = await authFetch(buildUrl(`/notes/${noteId}`));
    return toJson<Note>(response);
  },

  create: async (data: {
    title: string;
    content: string;
    categoryId: string;
    isPinned?: boolean;
    folderId?: string;
  }) => {
    const response = await authFetch(buildUrl("/notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return toJson<Note>(response);
  },

  update: async (
    noteId: string,
    data: {
      title?: string;
      content?: string;
      categoryId?: string;
      isPinned?: boolean;
      folderId?: string;
    },
  ) => {
    const response = await authFetch(buildUrl(`/notes/${noteId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return toJson<Note>(response);
  },

  delete: async (noteId: string) => {
    const response = await authFetch(buildUrl(`/notes/${noteId}`), {
      method: "DELETE",
    });
    return toJson<{ message: string }>(response);
  },

  togglePin: async (noteId: string) => {
    const response = await authFetch(buildUrl(`/notes/${noteId}/toggle-pin`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return toJson<Note>(response);
  },

  getCategories: async () => {
    const response = await authFetch(buildUrl("/notes/categories"));
    return toJson<NoteCategory[]>(response);
  },

  createCategory: async (data: {
    name: string;
    color?: string;
    icon?: string;
  }) => {
    const response = await authFetch(buildUrl("/notes/categories"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return toJson<NoteCategory>(response);
  },

  updateCategory: async (
    categoryId: string,
    data: { name?: string; color?: string; icon?: string },
  ) => {
    const response = await authFetch(
      buildUrl(`/notes/categories/${categoryId}`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return toJson<NoteCategory>(response);
  },

  deleteCategory: async (categoryId: string) => {
    const response = await authFetch(
      buildUrl(`/notes/categories/${categoryId}`),
      {
        method: "DELETE",
      },
    );
    return toJson<{ message: string }>(response);
  },
};

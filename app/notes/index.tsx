import FloatingActionButton from "@/components/common/FloatingActionButton";
import CategoryFilter from "@/components/notes/CategoryFilter";
import NoteCard from "@/components/notes/NoteCard";
import SearchBar from "@/components/notes/SearchBar";
import { noteApi } from "@/services/api/note";
import type { Note, NoteCategory, NoteListItem } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function NotesScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setErrorMessage(null);
      const [notesRes, categoriesRes] = await Promise.all([
        noteApi.getAll({ take: 100 }),
        noteApi.getCategories(),
      ]);
      setNotes(notesRes.notes);
      setCategories(categoriesRes);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Cannot load notes",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData(false);
      return undefined;
    }, [loadData]),
  );

  const filteredNotes = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return notes
      .filter((note) => {
        const matchCategory =
          selectedCategoryId === "all" ||
          note.categoryId === selectedCategoryId;

        const matchSearch =
          keyword.length === 0 ||
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword) ||
          note.category?.name?.toLowerCase().includes(keyword);

        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [notes, searchQuery, selectedCategoryId]);

  const noteItems: NoteListItem[] = useMemo(
    () =>
      filteredNotes.map((note) => ({
        noteId: note.noteId,
        title: note.title || "Untitled",
        preview: note.content?.replace(/<[^>]+>/g, " ").trim() || "No content",
        category: note.category,
        timestamp: formatTimestamp(note.updatedAt),
        isPinned: note.isPinned,
      })),
    [filteredNotes],
  );

  const handleNotePress = (noteId: string) => {
    router.push({ pathname: "/notes/edit", params: { id: noteId } });
  };

  const handleCreateNote = () => {
    router.push("/notes/edit");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pb-4 pt-12">
        <Text className="text-2xl font-bold text-gray-primary">Notes</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#505050" />
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <CategoryFilter
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategoryId={setSelectedCategoryId}
      />

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00B14F" />
        </View>
      )}

      {!loading && errorMessage && (
        <View className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-red-600">{errorMessage}</Text>
        </View>
      )}

      {!loading && !errorMessage && (
        <FlatList
          data={noteItems}
          keyExtractor={(item) => item.noteId}
          renderItem={({ item }) => (
            <View className="px-4">
              <NoteCard note={item} onPress={handleNotePress} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void loadData(true);
              }}
              colors={["#00B14F"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-gray-text">No notes found.</Text>
            </View>
          }
        />
      )}

      <FloatingActionButton onPress={handleCreateNote} />
    </SafeAreaView>
  );
}

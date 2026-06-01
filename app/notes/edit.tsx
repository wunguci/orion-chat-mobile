import CategoryPickerModal from "@/components/notes/CategoryPickerModal";
import RichTextEditor from "@/components/notes/RichTextEditor";
import { noteApi } from "@/services/api/note";
import type { Note, NoteCategory } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

const getStringParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function EditNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const noteId = getStringParam(params.id);
  const isEditMode = Boolean(noteId);
  const [draftNoteId, setDraftNoteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [note, setNote] = useState<Note | null>(null);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentNoteId = noteId || draftNoteId;
  const hasPersistedNote = Boolean(currentNoteId);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.categoryId === categoryId),
    [categories, categoryId],
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const categoriesRes = await noteApi.getCategories();
        setCategories(categoriesRes);

        if (isEditMode && noteId) {
          const noteRes = await noteApi.getOne(noteId);
          setNote(noteRes);
          setTitle(noteRes.title || "");
          setContent(noteRes.content || "");
          setCategoryId(noteRes.categoryId);
          setIsPinned(noteRes.isPinned);
        } else if (categoriesRes.length > 0) {
          setCategoryId(categoriesRes[0].categoryId);
        }
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to load note",
        );
        if (isEditMode) {
          router.back();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [isEditMode, noteId, router]);

  useEffect(() => {
    const createDraft = async () => {
      if (isEditMode || !categoryId || draftNoteId) return;

      try {
        setIsSaving(true);
        const created = await noteApi.create({
          title: "New Note",
          content: " ",
          categoryId,
          isPinned: false,
        });
        setDraftNoteId(created.noteId);
        setNote(created);
        setTitle(created.title || "New Note");
        setContent(created.content?.trim() ? created.content : "");
        setIsPinned(created.isPinned);
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "Failed to create draft note",
        );
      } finally {
        setIsSaving(false);
      }
    };

    void createDraft();
  }, [isEditMode, categoryId, draftNoteId]);

  const handleSave = async () => {
    const normalizedCategoryId = categoryId || categories[0]?.categoryId;
    if (!normalizedCategoryId) return;

    const normalizedTitle = title.trim() || "New Note";
    const normalizedContent = content.trim() ? content : " ";

    setIsSaving(true);
    try {
      if (currentNoteId) {
        const updated = await noteApi.update(currentNoteId, {
          title: normalizedTitle,
          content: normalizedContent,
          categoryId: normalizedCategoryId,
          isPinned,
        });
        setNote(updated);
      } else {
        const created = await noteApi.create({
          title: normalizedTitle,
          content: normalizedContent,
          categoryId: normalizedCategoryId,
          isPinned,
        });
        setDraftNoteId(created.noteId);
        setNote(created);
      }

      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save note",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!currentNoteId) return;

    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const backup = {
            title: title.trim(),
            content,
            categoryId,
            isPinned,
          };

          try {
            setIsSaving(true);
            await noteApi.delete(currentNoteId);

            Alert.alert(
              "Note deleted",
              "You can undo this action now.",
              [
                {
                  text: "Undo",
                  onPress: async () => {
                    try {
                      const restored = await noteApi.create({
                        title: backup.title,
                        content: backup.content,
                        categoryId: backup.categoryId,
                      });

                      if (backup.isPinned) {
                        await noteApi.togglePin(restored.noteId);
                      }

                      router.back();
                    } catch (restoreError) {
                      Alert.alert(
                        "Error",
                        restoreError instanceof Error
                          ? restoreError.message
                          : "Failed to restore note",
                      );
                      router.back();
                    }
                  },
                },
                {
                  text: "Done",
                  onPress: () => router.back(),
                },
              ],
              { cancelable: false },
            );
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete note",
            );
          } finally {
            setIsSaving(false);
          }
        },
      },
    ]);
  };

  const handleTogglePin = async () => {
    if (currentNoteId) {
      try {
        setIsSaving(true);
        const updated = await noteApi.togglePin(currentNoteId);
        setNote(updated);
        setIsPinned(updated.isPinned);
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to pin note",
        );
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsPinned((prev) => !prev);
  };

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return;

    if (
      categories.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ) {
      return;
    }

    try {
      const created = await noteApi.createCategory({ name: name.trim() });
      setCategories((prev) => [...prev, created]);
      setCategoryId(created.categoryId);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create category",
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-gray-secondary">Loading note...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pb-4 pt-12">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-4"
          >
            <Ionicons name="arrow-back" size={24} color="#505050" />
            <Text className="text-lg font-semibold text-gray-primary">
              {isEditMode ? "Edit Note" : "New Note"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => void handleTogglePin()}
              className="mr-4"
            >
              <Ionicons
                name={isPinned ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isPinned ? colors.primary : "#505050"}
              />
            </TouchableOpacity>

            {hasPersistedNote && (
              <TouchableOpacity onPress={handleDelete} className="mr-4">
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => void handleSave()}
              disabled={isSaving}
            >
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1">
          <View className="border-b border-gray-border px-4 pb-3 pt-4">
            <View className="flex-row justify-between">
              <Text className="mb-2 text-xs text-gray-secondary">TITLE</Text>
              <Text className="text-xs text-gray-secondary">
                {title.length}/255
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter note title"
              placeholderTextColor="#94a3b8"
              className="text-xl font-semibold text-gray-primary"
              maxLength={255}
              editable={!isSaving}
            />
          </View>

          <View className="border-b border-gray-border px-4 py-3">
            <Text className="mb-2 text-xs font-semibold text-gray-secondary">
              CATEGORY
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="flex-row items-center justify-between py-2"
              disabled={isSaving}
            >
              <Text className="text-base text-gray-primary capitalize">
                {selectedCategory?.name || "Select category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View className="px-4 pb-2 pt-3">
            <Text className="text-xs font-semibold text-gray-secondary">
              CONTENT
            </Text>
          </View>

          <View className="flex-1">
            <RichTextEditor
              initialContent={content}
              onContentChange={setContent}
              placeholder="Start writing your note..."
            />
          </View>
        </View>

        <CategoryPickerModal
          visible={showCategoryPicker}
          categories={categories}
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
          onAddCategory={(name) => {
            void handleAddCategory(name);
          }}
          onClose={() => setShowCategoryPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import CategoryPickerModal from "@/components/notes/CategoryPickerModal";
import RichTextEditor from "@/components/notes/RichTextEditor";
import { NoteCategory } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: "finance", label: "Finance" },
  { value: "sport", label: "Sport" },
  { value: "personal", label: "Personal" },
  { value: "work", label: "Work" },
];

// mock function để load note, thay bằng api thật sau
const loadNoteById = async (id: string) => {
  // giả lập api call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // mock data - thay bằng: await noteService.getNoteById(id);
  return {
    id,
    title: "Monthly Budget Planning",
    content:
      "<p>Review the expenses from last month and allocate funds for the upcoming holiday...</p>",
    category: "finance" as NoteCategory,
    isPinned: false,
  };
};

export default function EditNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // lấy id từ URL params
  const noteId = params.id as string | undefined;

  // detect mode: có id = Edit, không có = create
  const isEditNote = !!noteId;

  // states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("finance");
  const [isPinned, setIsPinned] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      if (isEditNote && noteId) {
        setIsLoading(true);
        try {
          const note = await loadNoteById(noteId);
          setTitle(note.title);
          setContent(note.content);
          setCategory(note.category);
          setIsPinned(note.isPinned);
        } catch (error) {
          Alert.alert("Error", "Failed to load note. Please try again.");
          router.back();
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadNote();
  }, [noteId, isEditNote]);

  const handleSave = async () => {
    // validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Error", "Please enter some content");
      return;
    }

    try {
      setIsLoading(true);

      if (isEditNote) {
        // update existing note
        console.log("Updating note: ", {
          id: noteId,
          title,
          content,
          category,
          isPinned,
        });
      } else {
        // create new note
        console.log("Creating note: ", {
          title,
          content,
          category,
          isPinned,
        });
      }

      Alert.alert(
        "Success",
        `Note ${isEditNote ? "updated" : "created"} successfully!`,
      );
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${isEditNote ? "update" : "create"} note`,
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            console.log("Deleting note: ", noteId);
            Alert.alert("Success", "Note deleted successfully!");
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete note");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (isLoading && isEditNote) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#14b8a6" />
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
        {/* Header */}
        <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row gap-4"
          >
            <Ionicons name="arrow-back" size={24} color="#505050" />

            {/* Title */}
            <Text className="text-lg font-semibold text-gray-primary">
              {isEditNote ? "Edit Note" : "New Note"}
            </Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View className="flex-row items-center">
            {/* pin */}
            <TouchableOpacity
              onPress={() => setIsPinned(!isPinned)}
              className="mr-4"
            >
              <Ionicons
                name={isPinned ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isPinned ? "#14b8a6" : "#505050"}
              />
            </TouchableOpacity>

            {/* delete button  */}
            {isEditNote && (
              <TouchableOpacity onPress={handleDelete} className="mr-4">
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}

            {/* save button */}
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              {/* <Ionicons name="checkmark" size={24} color={isLoading ? '#CBD5E1' : '#14b8a6'}/> */}
              <Text className="text-base font-semibold text-green-primary">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form content  */}
        <View className="flex-1">
          {isLoading && (
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <ActivityIndicator size="large" color="#14b8a6" />
            </View>
          )}

          {/* title input  */}
          <View className="px-4 pt-4 border-b border-gray-border pb-3">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-secondary mb-2">TITLE</Text>
              <Text className="text-xs text-gray-secondary">
                {title.length}/100
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter note title"
              placeholderTextColor="#94a3b8"
              className="text-xl font-semibold text-gray-primary"
              maxLength={100}
              editable={!isLoading}
            />
          </View>

          {/* category picker */}
          <View className="px-4 py-3 border-b border-gray-border">
            <Text className="text-xs font-semibold text-gray-secondary mb-2">
              CATEGORY
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="flex-row justify-between items-center py-2"
              disabled={isLoading}
            >
              <Text className="text-base text-gray-primary capitalize">
                {category}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* content label */}
          <View className="px-4 pt-3 pb-2">
            <Text className="text-xs font-semibold text-gray-secondary">
              CONTENT
            </Text>
          </View>

          {/* rich text editor */}
          <View className="flex-1">
            <RichTextEditor
              initialContent={content}
              onContentChange={setContent}
              placeholder="Start writing your note..."
            />
          </View>
        </View>

        {/* category picker modal  */}
        <CategoryPickerModal
          visible={showCategoryPicker}
          selectedCategory={category}
          onSelect={setCategory}
          onClose={() => setShowCategoryPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

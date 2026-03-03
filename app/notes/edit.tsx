import { NoteCategory } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
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
                Alert.alert("Error", "Failed to load note. Please try again.")
                router.back();
            } finally {
                setIsLoading(false);
            }
        }
    }

    loadNote();
  }, [noteId, isEditNote])

  const handleDelete = () => {};
  const handleSave = () => {};

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
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="flex-row gap-4">
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
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={24} color={isLoading ? '#CBD5E1' : '#14b8a6'}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Form content  */}
      <View className="flex-1">
          {/* title input  */}
          <View className="px-4 pt-4 border-b border-gray-border pb-3">
            <Text className="text-xs font-semibold text-gray-secondary mb-2">
                TITLE
            </Text>
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
                <Ionicons name="chevron-down" size={20} color="#94a3b8"/>
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

          </View>

      </View>
    </SafeAreaView>
  );
}

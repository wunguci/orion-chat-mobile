import CategoryFilter from "@/components/notes/CategoryFilter";
import NoteCard from "@/components/notes/NoteCard";
import SearchBar from "@/components/notes/SearchBar";
import { NoteCategory, NoteListItem } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FloatingActionButton from "@/components/common/FloatingActionButton";

const MOCK_NOTES: NoteListItem[] = [
  {
    id: "1",
    title: "Monthly Budget Planning",
    preview:
      "Review the expenses from last month and allocate funds for the upcoming holiday...",
    category: "finance",
    timestamp: "10:30 AM",
    isPinned: false,
  },
  {
    id: "2",
    title: "Gym Workout Routine",
    preview:
      "Monday: Chest and Triceps. Tuesday: Back and Biceps. Remember to keep hydration high.",
    category: "sport",
    timestamp: "YESTERDAY",
    isPinned: false,
  },
  {
    id: "3",
    title: "Grocery List",
    preview:
      "Milk, Eggs, Whole wheat bread, Avocados, Coffee beans, Oat milk...",
    category: "personal",
    timestamp: "OCT 24",
    isPinned: false,
  },
  {
    id: "4",
    title: "Project Alpha Strategy",
    preview:
      "The main goal is to increase user retention by 15% in Q4 through gamification elements.",
    category: "work",
    timestamp: "OCT 22",
    isPinned: false,
  },
];

export default function NotesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | NoteCategory
  >("all");

  const filteredNotes = MOCK_NOTES.filter((note) => {
    const matchesCategory =
      selectedCategory === "all" || note.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleNotePress = (id: string) => {
    router.push(`/notes/edit?id=${id}`);
  };

  const handleCreateNote = () => {
    router.push("/notes/edit");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-primary">Notes</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#505050" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Note list */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <NoteCard note={item} onPress={handleNotePress} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating action button */}
      <FloatingActionButton onPress={handleCreateNote}/>
    </SafeAreaView>
  );
}

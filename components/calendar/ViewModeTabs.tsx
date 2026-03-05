import { ViewMode } from "@/types/calendar";
import { Text, TouchableOpacity, View } from "react-native";

interface ViewModeTabsProps {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
}

export default function ViewModeTabs({
  activeView,
  onChange,
}: ViewModeTabsProps) {
  const tabs: ViewMode[] = ["day", "week", "month", "year"];

  return (
    <View className="flex-row bg-white border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = activeView === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(tab)}
            className="flex-1 py-3 items-center"
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                isActive ? "text-teal-600" : "text-teal-500"
              }`}
            >
              {tab}
            </Text>
            {isActive && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

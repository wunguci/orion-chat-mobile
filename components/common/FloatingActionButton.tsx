import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColors";

interface FloatingActionButtonProps {
    onPress: () => void;
}

export default function FloatingActionButton({
    onPress
}: FloatingActionButtonProps) {
    const colors = useThemeColors();

    return (
        <TouchableOpacity 
            onPress={onPress}
            className="absolute bottom-20 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
            style={{
                backgroundColor: colors.primary,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8
            }}
        >
            <Ionicons name="add" size={28} color="white"/>
        </TouchableOpacity>
    )
}
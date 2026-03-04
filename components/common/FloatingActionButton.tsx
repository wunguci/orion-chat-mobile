import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FloatingActionButtonProps {
    onPress: () => void;
}

export default function FloatingActionButton({
    onPress
}: FloatingActionButtonProps) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            className="absolute bottom-20 right-6 w-14 h-14 bg-green-primary rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
            style={{
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
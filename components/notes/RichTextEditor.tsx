import { useRef } from "react";
import { View, StyleSheet } from "react-native";
import {RichEditor, RichToolbar, actions} from 'react-native-pell-rich-editor';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface RichTextEditorProps {
    initialContent?: string;
    onContentChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({
    initialContent = "",
    onContentChange,
    placeholder = "Start writing your note..."
}: RichTextEditorProps) {
    const richText = useRef<RichEditor>(null);

    return (
        <View style={styles.container}>
            <RichEditor 
                ref={richText}
                initialContentHTML={initialContent}
                onChange={onContentChange}
                placeholder={placeholder}
                // androidHardwareAccelerationDisabled={true}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    editor: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    toolbar: {
        backgroundColor: '#F5F5F5',
        borderTopWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 8
    },
    toolbarContainer: {
        paddingHorizontal: 16
    }
})
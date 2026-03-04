import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

interface RichTextEditorProps {
  initialContent?: string;
  onContentChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  initialContent = "",
  onContentChange,
  placeholder = "Start writing your note...",
}: RichTextEditorProps) {
  const richText = useRef<RichEditor>(null);

  return (
    <View style={styles.container}>
      <RichEditor
        ref={richText}
        initialContentHTML={initialContent}
        onChange={onContentChange}
        placeholder={placeholder}
        // androidHardwareAccelerationDisabled={false}
        style={styles.editor}
        editorStyle={{
          backgroundColor: "#FFFFFF",
          color: "#505050",
          placeholderColor: "#94a3b8",
          contentCSSText: `
                        font-size: 16px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: 16px;
                        line-height: 1.6;
                    `,
        }}
        useContainer={true}
        initialFocus={false}
      />

      {/* rich toolbar */}
      <RichToolbar
        editor={richText}
        scrollable={true}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        actions={[
          actions.undo,
          actions.redo,
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.checkboxList,
          actions.heading1,
          actions.insertImage,
        ]}
        iconMap={{
          [actions.setBold]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-bold"
              size={22}
              color={tintColor}
            />
          ),
          [actions.setItalic]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-italic"
              size={22}
              color={tintColor}
            />
          ),
          [actions.setUnderline]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-underline"
              size={22}
              color={tintColor}
            />
          ),
          [actions.insertBulletsList]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={22}
              color={tintColor}
            />
          ),
          [actions.insertOrderedList]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-list-numbered"
              size={22}
              color={tintColor}
            />
          ),
          [actions.checkboxList]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="checkbox-marked-outline"
              size={22}
              color={tintColor}
            />
          ),
          [actions.insertImage]: ({ tintColor }: any) => (
            <Ionicons name="image-outline" size={22} color={tintColor} />
          ),
          [actions.heading1]: ({ tintColor }: any) => (
            <MaterialCommunityIcons
              name="format-header-1"
              size={22}
              color={tintColor}
            />
          ),
          [actions.undo]: ({ tintColor }: any) => (
            <Ionicons name="arrow-undo" size={22} color={tintColor} />
          ),
          [actions.redo]: ({ tintColor }: any) => (
            <Ionicons name="arrow-redo" size={22} color={tintColor} />
          ),
        }}
        style={styles.toolbar}
        flatContainerStyle={styles.toolbarContainer}
        iconTint="#505050"
        selectedIconTint="#14b8a6"
        disabledIconTint="#CBD5E1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  editor: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  toolbar: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 8,
  },
  toolbarContainer: {
    paddingLeft: 16,
    paddingRight: 100,
    gap: 12,
  },
});

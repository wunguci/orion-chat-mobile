import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkHubScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          gap: 8,
        }}
      >
        <Text style={{ color: "#E6E6E6", fontSize: 24, fontWeight: "700" }}>
          WorkHub
        </Text>
        <Text style={{ color: "#9A9A9A", fontSize: 14, textAlign: "center" }}>
          Tinh nang dang duoc phat trien. Ban co the tiep tuc su dung cac muc
          khac tu drawer.
        </Text>
      </View>
    </SafeAreaView>
  );
}

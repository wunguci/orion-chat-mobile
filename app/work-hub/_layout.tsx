import { Stack } from "expo-router";

export default function WorkHubLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f5f7fa" },
      }}
    />
  );
}

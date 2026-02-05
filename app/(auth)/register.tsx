import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FontSizes, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    // TODO: Implement register logic
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)");
    }, 1000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Đăng ký</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tạo tài khoản mới
      </Text>

      <View style={styles.form}>
        <Input
          label="Email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
        />

        <Input
          label="Tên người dùng"
          placeholder="username"
          value={username}
          onChangeText={setUsername}
          icon="at-outline"
        />

        <Input
          label="Tên hiển thị"
          placeholder="Nguyen Van A"
          value={displayName}
          onChangeText={setDisplayName}
          icon="person-outline"
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChangeText={setPassword}
          icon="lock-closed-outline"
        />

        <Button
          title="Đăng ký"
          onPress={handleRegister}
          loading={loading}
          fullWidth
        />

        <Button
          title="Đã có tài khoản? Đăng nhập"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
    paddingTop: Platform.OS === "ios" ? 100 : Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.base,
  },
});

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FontSizes, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // TODO: Implement login logic
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
      <Text style={[styles.title, { color: colors.text }]}>Đăng nhập</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Chào mừng bạn quay lại!
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
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          icon="lock-closed-outline"
        />

        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
          fullWidth
        />

        <Button
          title="Chưa có tài khoản? Đăng ký"
          onPress={() => router.push("/register" as any)}
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

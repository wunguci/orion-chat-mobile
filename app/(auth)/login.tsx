import { Eye, EyeOff } from "@/components/common/Icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { authApi } from "../../services/api/auth";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError("Vui lòng nhập số điện thoại và mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(phone.trim(), password);
      await AsyncStorage.setItem("auth_token", response.data.token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(response.data));
      router.replace("/(tabs)");
    } catch (err) {
      let message = err instanceof Error ? err.message : "Đăng nhập thất bại.";

      if (message.toLowerCase().includes("network request failed")) {
        message =
          "Khong ket noi duoc server. Neu dung Android emulator hay thu 10.0.2.2:3000 hoac set EXPO_PUBLIC_API_URL.";
      }
      setError(message);
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#5FA7A6]">
      {/* Image */}
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAE7t70-7B8mihXIcBDA4GzUlEcEtdb_2CRUqD1SOledxCJd989SacT2XJRF_Zndm1lgWPMtpUXcXei5HqwGeufmv0LRzC4OHRS45VxFq3wIQTC5oSjdTFgtJQOOAsXiMjsWYOMHufnbTOAIAjJml0WMVJ7TklvRt4IgY6i2grno-ALslU4ktzox7gN8JvUAc3AkMQOpJx2xo79fN7yZvblZTKUVLq_jpN3EfFtzFThprrP75QpHzai74yI6lGUkQpXBfd8DT8CJW1c",
        }}
        className="w-full h-[45vh]"
        resizeMode="cover"
      />

      {/* Form */}
      <View className="flex-1 bg-white rounded-t-[40px] px-6 pt-10">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-4xl font-bold text-[#006275] text-center">
            LOG IN
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2">
            Please enter your details to continue
          </Text>

          {/* Phone */}
          <View className="mt-6">
            <Text className="text-xs font-semibold text-gray-700 mb-2">
              PHONE NUMBER
            </Text>
            <TextInput
              placeholder="000 000 0000"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-full px-4 py-3.5"
            />
          </View>

          {/* Password */}
          <View className="mt-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs font-semibold text-gray-700">
                PASSWORD
              </Text>
              <Pressable onPress={() => router.push("/forgotPassword" as any)}>
                <Text className="text-xs text-[#006275]">Forgot?</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center border border-gray-300 rounded-full px-4">
              <TextInput
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="flex-1 py-3.5"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Remember */}
          <Pressable
            className="flex-row items-center mt-6"
            onPress={() => setRemember(!remember)}
          >
            <View
              className={`w-11 h-6 rounded-full p-0.5 ${
                remember ? "bg-[#006275]" : "bg-gray-300"
              }`}
            >
              <View
                className={`w-5 h-5 bg-white rounded-full ${
                  remember ? "translate-x-5" : ""
                }`}
              />
            </View>
            <Text className="ml-3 text-sm text-gray-700">Remember me</Text>
          </Pressable>

          {/* Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="mt-8 bg-[#2DB5B0] py-4 rounded-full items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Log in</Text>
            )}
          </Pressable>

          {/* Error */}
          {error && (
            <Text className="text-red-500 text-center mt-3">{error}</Text>
          )}

          {/* Register */}
          <View className="flex-row justify-center mt-6 mb-6">
            <Text className="text-gray-600">Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push("/register" as any)}>
              <Text className="text-[#006275] font-semibold">Register now</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

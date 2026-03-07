import { Eye, EyeOff } from '@/components/common/Icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    return (
        <View className="flex-1 bg-[#5FA7A6]">
            {/* Top Illustration */}
            <View className="h-60 w-full">
                <Image
                    source={{
                        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE7t70-7B8mihXIcBDA4GzUlEcEtdb_2CRUqD1SOledxCJd989SacT2XJRF_Zndm1lgWPMtpUXcXei5HqwGeufmv0LRzC4OHRS45VxFq3wIQTC5oSjdTFgtJQOOAsXiMjsWYOMHufnbTOAIAjJml0WMVJ7TklvRt4IgY6i2grno-ALslU4ktzox7gN8JvUAc3AkMQOpJx2xo79fN7yZvblZTKUVLq_jpN3EfFtzFThprrP75QpHzai74yI6lGUkQpXBfd8DT8CJW1c',
                    }}
                    className=" h-[45vh]"
                    resizeMode="cover"
                />
            </View>

            <View className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[40px] px-6 pt-10 pb-8 min-h-[65%]">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <Text className="text-4xl font-bold text-[#006275] text-center">
                        LOG IN
                    </Text>
                    <Text className="text-sm text-gray-400 text-center mt-2">
                        Please enter your details to continue
                    </Text>

                    <View className="mt-6">
                        <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                            PHONE NUMBER
                        </Text>
                        <TextInput
                            placeholder="000 000 0000"
                            placeholderTextColor="#9CA3AF"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            className="border border-gray-300 rounded-full px-4 py-3.5 text-base text-gray-900 bg-white"
                        />
                    </View>

                    <View className="mt-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-xs font-semibold text-gray-700 tracking-wide">
                                PASSWORD
                            </Text>
                            <Pressable
                                onPress={() =>
                                    router.push('/forgotPassword' as any)
                                }
                            >
                                <Text className="text-xs font-semibold text-[#006275]">
                                    Forgot?
                                </Text>
                            </Pressable>
                        </View>

                        <View className="flex-row items-center border border-gray-300 rounded-full px-4 bg-white">
                            <TextInput
                                placeholder="••••••••••••"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                className="flex-1 py-3.5 text-base text-gray-900"
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                className="p-2"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color="#9CA3AF" />
                                ) : (
                                    <Eye size={20} color="#9CA3AF" />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        className="flex-row items-center mt-6"
                        onPress={() => setRemember(!remember)}
                    >
                        <View
                            className={`w-11 h-6 rounded-full justify-center p-0.5 ${
                                remember ? 'bg-[#006275]' : 'bg-gray-300'
                            }`}
                        >
                            <View
                                className={`w-5 h-5 rounded-full bg-white ${
                                    remember ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </View>
                        <Text className="ml-3 text-sm font-medium text-gray-700">
                            Remember me
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => router.replace('/(tabs)')}
                        className="mt-8 bg-[#2DB5B0] py-4 rounded-full items-center shadow-md"
                    >
                        <Text className="text-white text-lg font-semibold">
                            Log in
                        </Text>
                    </Pressable>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-sm text-gray-600">
                            Don&apos;t have an account?{' '}
                        </Text>
                        <Pressable
                            onPress={() => router.push('/register' as any)}
                        >
                            <Text className="text-sm font-semibold text-[#006275]">
                                Register now
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

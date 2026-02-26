import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

export default function WelcomeScreen() {
    return (
        <View className="flex-1 bg-white items-center justify-between px-6 py-12">
            <View className="items-center mt-10">
                <Image
                    source={{
                        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIo7vyeQB9mKKi23s_iHq22VGc2dmZzPQKQxDovAjx6bnwiLNhdWXeoXrf0vtJZcooaVlY4ZHPtTRhUF73gp9T0riKIMB-r8u5heoWg-L-jdZhr5xx76Fc8f_oS7xnFGlCucC402lJL6t-_7KFw5s4KDzd21dv-yQP5v0cUBQybBoGqzk7iRDTOEptFy-5xJMinbRaErhSP5R1zXS10QxdB8Ge6VwDhQgZ9wsbLV8A7Q9kFrUxbJtVb5O5WIAbulX_S2nEkZryB66c',
                    }}
                    resizeMode="contain"
                    className="w-64 h-64"
                />
            </View>

            {/* ===== Content ===== */}
            <View className="items-center px-4">
                <Text className="text-3xl font-bold text-[#1f3f3f] mb-4">
                    Welcome to chat
                </Text>

                <Text className="text-center text-gray-400 text-base leading-6">
                    Experience seamless messaging and global connectivity at
                    your fingertips.
                </Text>
            </View>

            {/* ===== Actions ===== */}
            <View className="w-full space-y-4">
                {/* Register */}
                <Pressable
                    onPress={() => router.push('/register')}
                    className="w-full bg-[#2FB6B2] py-4 rounded-full items-center"
                >
                    <Text className="text-white text-lg font-semibold">
                        Register
                    </Text>
                </Pressable>

                {/* Login */}
                <Pressable
                    onPress={() => router.push('/login')}
                    className="w-full border border-[#2FB6B2] py-4 rounded-full items-center"
                >
                    <Text className="text-[#2FB6B2] text-lg font-semibold">
                        Log in
                    </Text>
                </Pressable>
            </View>

            {/* ===== Footer ===== */}
            <View className="flex-row items-center space-x-3">
                <Text className="text-gray-300 text-sm">Terms of Service</Text>
                <View className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                <Text className="text-gray-300 text-sm">Privacy Policy</Text>
            </View>
        </View>
    );
}

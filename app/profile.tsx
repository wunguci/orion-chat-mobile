import SettingsHeader from '@/components/setting/SettingsHeader';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
    const user = {
        name: 'ThankZang',
        bio: 'Exploring the intersection of design and technology. Creating minimalist experiences.',
        coverImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ckwVnuZo6vXkCKHII2HuG9paomydT6eRVkB0xPR_C4w1xbf_hfUhAu31Z8nRJa0XX78Izii2dhYWgrw8AtU8GVgmcxQQ9PwM616h7f1oTkKcM6qBNoQQQAen9FAksGS7J7AwF4YPGIWPaBwH_BSTsR0HmjixB-gjfv4l0G8Co1OQEDc_BNsMo7sljmm9Td-wkuMVff13ec5qTgMgmpezusJovOC3__IyZkTuZ0ac9lEV_Wnf6Wsi3tZ5Kg4h6ZzoEg4QsfRYnJes',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUj1Spfodjy9TvQFYvQapp0gi2rm0Qzvt6NF83DBQLLgtRESzvtGr1rJf5HusHmzemLvajHPKNzO2V5YfuXT4TUJ-bsEtGBmW52fNDtzGXa7PUloWDLwAILsbyw3uAYUyw8nF6TJveyRz5FjjiOeb3QPo_Jehn6ijPzRpOOf1f9qORwRKgoP3dy1dZMKIc3gHdKodGOyZAAlmE0XiPb7LgZBs-aKIgMujUzYau4-e2iXRcg0a5_K9jYJi6Hf2hd0x5E61BvZk0fDf6',
        address: 'San Francisco, CA',
        currentLocation: 'Current Location',
        birthdate: 'July 12th, 1995',
        birthdayLabel: 'Birthday',
        joined: 'Joined May 2021',
        memberStatus: 'Member Status',
        interests: [
            'Minimalist Design',
            'UX Research',
            'Photography',
            'Architecture',
            'Tech Ethics',
        ],
        stats: {
            friends: '1.2k',
            photos: '450',
            videos: '85',
        },
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <SettingsHeader title="Profile" showBack={true} />

                {/* Cover Image */}
                <View className="h-48 bg-gradient-to-b from-gray-400 to-gray-300">
                    <Image
                        source={{
                            uri: user.coverImage,
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                    />
                </View>

                {/* Avatar */}
                <View className=" items-center -mt-16 ">
                    {' '}
                    <View className=" w-32 h-32 rounded-full bg-green-bg-heavy border-4 border-white items-center justify-center shadow-lg ">
                        {' '}
                        <Image
                            source={{
                                uri: user.avatar,
                            }}
                            className=" h-full w-full rounded-full "
                            resizeMode="cover"
                        />{' '}
                    </View>{' '}
                </View>

                {/* Name and Bio */}
                <View className="items-center px-6">
                    <View className="flex-row items-center justify-center gap-2">
                        <Text className="text-2xl font-bold text-teal-700">
                            {user.name}
                        </Text>
                        <Feather name="edit-2" size={18} color="#0d9488" />
                    </View>

                    <Text className="text-center text-gray-600 mt-3 leading-6 text-sm">
                        {user.bio}
                    </Text>
                </View>

                {/* Message and Call Buttons */}
                <View className="flex-row gap-4 mt-6 px-6">
                    <TouchableOpacity className="flex-1 bg-teal-700 py-3 rounded-full flex-row items-center justify-center gap-2">
                        <MaterialIcons name="mail" size={18} color="white" />
                        <Text className="text-white font-semibold">
                            Message
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-1 border-2 border-teal-700 py-3 rounded-full flex-row items-center justify-center gap-2">
                        <Feather name="phone" size={18} color="#0d9488" />
                        <Text className="text-teal-700 font-semibold">
                            Call
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between bg-white mt-6 py-6 px-8 border-t border-b border-gray-200">
                    <View className="items-center">
                        <Text className="font-bold text-lg text-gray-800">
                            {user.stats.friends}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1 font-semibold">
                            FRIENDS
                        </Text>
                    </View>

                    <View className="items-center">
                        <Text className="font-bold text-lg text-gray-800">
                            {user.stats.photos}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1 font-semibold">
                            PHOTOS
                        </Text>
                    </View>

                    <View className="items-center">
                        <Text className="font-bold text-lg text-gray-800">
                            {user.stats.videos}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1 font-semibold">
                            VIDEOS
                        </Text>
                    </View>
                </View>

                {/* Interests Section */}
                <View className="bg-white mt-4 px-6 py-5 border-b border-gray-200">
                    <Text className="font-bold text-teal-700 mb-4 text-sm">
                        INTERESTS
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                        {user.interests.map((item, index) => (
                            <View
                                key={index}
                                className="bg-cyan-50 px-4 py-2 rounded-full border border-cyan-200"
                            >
                                <Text className="text-teal-700 font-medium text-sm">
                                    {item}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Details Section */}
                <View className="bg-white mt-4 px-6 py-5 border-b border-gray-200">
                    <Text className="font-bold text-teal-700 mb-5 text-sm">
                        CHI TIẾT
                    </Text>

                    {/* Location */}
                    <View className="flex-row items-start gap-3 mb-5">
                        <MaterialIcons
                            name="location-on"
                            size={22}
                            color="#0d9488"
                        />
                        <View className="flex-1">
                            <Text className="text-gray-800 font-medium">
                                {user.address}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {user.currentLocation}
                            </Text>
                        </View>
                    </View>

                    {/* Birthday */}
                    <View className="flex-row items-start gap-3 mb-5">
                        <MaterialIcons
                            name="card-giftcard"
                            size={22}
                            color="#0d9488"
                        />
                        <View className="flex-1">
                            <Text className="text-gray-800 font-medium">
                                {user.birthdate}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {user.birthdayLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Joined */}
                    <View className="flex-row items-start gap-3">
                        <MaterialIcons
                            name="calendar-today"
                            size={22}
                            color="#0d9488"
                        />
                        <View className="flex-1">
                            <Text className="text-gray-800 font-medium">
                                {user.joined}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {user.memberStatus}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

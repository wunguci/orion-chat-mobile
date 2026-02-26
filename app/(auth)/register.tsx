import { Eye, EyeOff } from '@/components/common/Icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function RegisterScreen() {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 2
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpInputs = useRef<(TextInput | null)[]>([]);

    // Step 3
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

    // Password validation
    const hasLength = password.length >= 8;
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>\[\]\\/~`_+=;-]/.test(password);
    const hasNumber = /\d/.test(password);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        // Trên Android, luôn đóng picker sau khi chọn
        // Trên iOS, chỉ đóng khi người dùng nhấn Done/Cancel
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setDate(selectedDate);
            const formatted = selectedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            setDob(formatted);
        }

        // Nếu người dùng cancel (selectedDate undefined) trên iOS
        if (Platform.OS === 'ios' && !selectedDate) {
            setShowDatePicker(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Back Button */}
            {step > 1 && (
                <Pressable
                    onPress={() => setStep((s) => (s - 1) as any)}
                    className="absolute top-12 left-6 z-10"
                >
                    <Text className="text-3xl text-gray-400">←</Text>
                </Pressable>
            )}

            {/* Progress Indicator */}
            <View className="flex-row justify-center gap-2 mt-14 mb-8">
                <View
                    className={`h-1 w-16 rounded-full ${step >= 1 ? 'bg-[#2DB5B0]' : 'bg-gray-300'}`}
                />
                <View
                    className={`h-1 w-16 rounded-full ${step >= 2 ? 'bg-[#2DB5B0]' : 'bg-gray-300'}`}
                />
                <View
                    className={`h-1 w-16 rounded-full ${step >= 3 ? 'bg-[#2DB5B0]' : 'bg-gray-300'}`}
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View className="flex-1 px-6">
                    {/* Title */}
                    <Text className="text-4xl font-bold text-[#006275] text-center mb-4">
                        {step === 1 && 'Register'}
                        {step === 2 && 'Verification'}
                        {step === 3 && 'Setup your identity'}
                    </Text>

                    {/* STEP 1 - Register */}
                    {step === 1 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                Enter your phone number to get started with our
                                social community
                            </Text>

                            {/* Phone Number */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    PHONE NUMBER
                                </Text>
                                <TextInput
                                    placeholder="000 - 000 - 0000"
                                    placeholderTextColor="#9CA3AF"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    className="w-full px-4 pt-4 pb-3.5 rounded-full border border-gray-300 bg-white"
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    PASSWORD
                                </Text>
                                <View className="flex-row items-center border border-gray-300 rounded-full px-4 bg-white">
                                    <TextInput
                                        placeholder="Enter password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        className="flex-1 py-3.5 text-base text-gray-900"
                                    />
                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
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

                            {/* Confirm Password */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    CONFIRM PASSWORD
                                </Text>
                                <View className="flex-row items-center border border-gray-300 rounded-full px-4 bg-white">
                                    <TextInput
                                        placeholder="Confirm password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        className="flex-1 py-3.5 text-base text-gray-900"
                                    />
                                    <Pressable
                                        onPress={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="p-2"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#9CA3AF" />
                                        ) : (
                                            <Eye size={20} color="#9CA3AF" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            {/* Requirements */}
                            <View className="bg-gray-50 p-4 rounded-2xl mb-6">
                                <Text className="text-sm font-semibold text-[#2DB5B0] mb-3">
                                    REQUIREMENTS
                                </Text>
                                <View className="space-y-3">
                                    {/* At least 8 characters */}
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className={`w-6 h-6 rounded-full items-center justify-center ${hasLength ? 'bg-[#2DB5B0]' : 'bg-white border-2 border-gray-300'}`}
                                        >
                                            {hasLength && (
                                                <Text className="text-white text-xs">
                                                    ✓
                                                </Text>
                                            )}
                                        </View>
                                        <Text
                                            className={`text-sm ${hasLength ? 'text-[#2DB5B0]' : 'text-gray-400'}`}
                                        >
                                            At least 8 characters
                                        </Text>
                                    </View>

                                    {/* Special symbol */}
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className={`w-6 h-6 rounded-full items-center justify-center ${hasSpecial ? 'bg-[#2DB5B0]' : 'bg-white border-2 border-gray-300'}`}
                                        >
                                            {hasSpecial && (
                                                <Text className="text-white text-xs">
                                                    ✓
                                                </Text>
                                            )}
                                        </View>
                                        <Text
                                            className={`text-sm ${hasSpecial ? 'text-[#2DB5B0]' : 'text-gray-400'}`}
                                        >
                                            At least one special symbol (@, #,
                                            $)
                                        </Text>
                                    </View>

                                    {/* Number */}
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className={`w-6 h-6 rounded-full items-center justify-center ${hasNumber ? 'bg-[#2DB5B0]' : 'bg-white border-2 border-gray-300'}`}
                                        >
                                            {hasNumber && (
                                                <Text className="text-white text-xs">
                                                    ✓
                                                </Text>
                                            )}
                                        </View>
                                        <Text
                                            className={`text-sm ${hasNumber ? 'text-[#2DB5B0]' : 'text-gray-400'}`}
                                        >
                                            At least one number
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-center text-sm text-gray-400 mb-8">
                                By tapping Next, you may receive an SMS for
                                verification. Message and data rates may apply.
                            </Text>
                        </>
                    )}

                    {/* STEP 2 - Verification */}
                    {step === 2 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                We&apos;ve sent a 6-digit code to your
                                registered mobile number{' '}
                                <Text className="text-gray-900">
                                    01* *** **89
                                </Text>
                            </Text>

                            {/* OTP Inputs */}
                            <View className="flex-row justify-center gap-3 mb-6">
                                {otp.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => {
                                            otpInputs.current[index] = ref;
                                        }}
                                        value={digit}
                                        onChangeText={(value) =>
                                            handleOtpChange(value, index)
                                        }
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        className="w-14 h-14 text-center text-2xl font-semibold text-gray-500 border border-gray-300 rounded-2xl bg-gray-50"
                                    />
                                ))}
                            </View>

                            {/* Resend */}
                            <View className="items-center mb-8">
                                <Text className="text-sm text-gray-400 mb-2">
                                    Resend code in{' '}
                                    <Text className="text-gray-700">00:55</Text>
                                </Text>
                                <Pressable>
                                    <Text className="text-sm font-semibold text-[#2DB5B0]">
                                        Resend now
                                    </Text>
                                </Pressable>
                            </View>

                            <Text className="text-center text-sm text-gray-400 mb-8">
                                By entering the code, you agree to our{' '}
                                <Text className="text-[#2DB5B0]">
                                    Terms of Service
                                </Text>{' '}
                                and{' '}
                                <Text className="text-[#2DB5B0]">
                                    Privacy Policy
                                </Text>
                            </Text>
                        </>
                    )}

                    {/* STEP 3 - Setup Identity */}
                    {step === 3 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                Add details so people recognize you.
                            </Text>

                            {/* Full Name */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    FULL NAME
                                </Text>

                                <TextInput
                                    placeholder="Nguyen Van A"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    keyboardType="default"
                                    className="border border-gray-300 rounded-full px-4 pt-3 pb-4 text-base text-gray-900 bg-white"
                                />
                            </View>

                            {/* Date of Birth */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    DATE OF BIRTH
                                </Text>

                                <Pressable
                                    onPress={() => {
                                        setShowDatePicker(true);
                                    }}
                                >
                                    <View pointerEvents="none">
                                        <TextInput
                                            placeholder="October 5, 2002"
                                            placeholderTextColor="#9CA3AF"
                                            value={dob}
                                            editable={false}
                                            className="border border-gray-300  rounded-full px-4 pt-3 pb-4 text-base text-gray-900 bg-white"
                                        />
                                    </View>
                                </Pressable>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display={
                                            Platform.OS === 'ios'
                                                ? 'spinner'
                                                : 'default'
                                        }
                                        onChange={handleDateChange}
                                        maximumDate={new Date()}
                                        accentColor="#2DB5B0"
                                        textColor="#006275"
                                        themeVariant="light"
                                    />
                                )}
                            </View>

                            {/* Gender */}
                            <View className="mb-8">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    GENDER
                                </Text>
                                <View className="bg-gray-100 rounded-full p-1 flex-row">
                                    {(['Male', 'Female', 'Other'] as const).map(
                                        (g) => (
                                            <Pressable
                                                key={g}
                                                onPress={() => setGender(g)}
                                                className={`flex-1 py-3 rounded-full items-center ${gender === g ? 'bg-white' : ''}`}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${gender === g ? 'text-[#006275]' : 'text-gray-500'}`}
                                                >
                                                    {g}
                                                </Text>
                                            </Pressable>
                                        ),
                                    )}
                                </View>
                            </View>

                            <Text className="text-center text-sm text-gray-400">
                                By tapping &quot;Complete&quot;, you agree to
                                our{' '}
                                <Text className="text-[#2DB5B0]">
                                    Terms of Service
                                </Text>{' '}
                                and{' '}
                                <Text className="text-[#2DB5B0]">
                                    Privacy Policy
                                </Text>{' '}
                                We use your data to enhance your discovery
                                experience.
                            </Text>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Button at Bottom */}
            <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
                {step === 1 && (
                    <Pressable
                        onPress={() => setStep(2)}
                        className="bg-[#2DB5B0] py-4 rounded-full items-center"
                    >
                        <Text className="text-white text-lg font-semibold">
                            Send OTP
                        </Text>
                    </Pressable>
                )}

                {step === 2 && (
                    <Pressable
                        onPress={() => setStep(3)}
                        className="bg-[#2DB5B0] py-4 rounded-full items-center"
                    >
                        <Text className="text-white text-lg font-semibold">
                            Next
                        </Text>
                    </Pressable>
                )}

                {step === 3 && (
                    <Pressable
                        onPress={() => router.replace('/login')}
                        className="bg-[#2DB5B0] py-4 rounded-full items-center"
                    >
                        <Text className="text-white text-lg font-semibold">
                            Complete
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

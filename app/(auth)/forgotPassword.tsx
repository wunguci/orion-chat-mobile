import { Eye, EyeOff } from '@/components/common/Icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    sendOtpForgetPassword,
    verifyOtpForgetPassword,
    resetPassword,
} from '@/services/api/auth';

export default function ForgotPasswordScreen() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1
    const [phone, setPhone] = useState('');

    // Step 2
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpInputs = useRef<(TextInput | null)[]>([]);

    // Step 3
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation flags
    const hasLength = newPassword.length >= 8;
    const hasSpecial = /[!@#$%^&*(),.?"':{}|<>\[\]\\/~`_+=;-]/.test(
        newPassword,
    );
    const hasNumber = /\d/.test(newPassword);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Tự động nhảy sang ô tiếp theo khi nhập
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Khi xóa
        if (e.nativeEvent.key === 'Backspace') {
            const newOtp = [...otp];

            // Nếu ô hiện tại có giá trị, xóa nó
            if (otp[index]) {
                newOtp[index] = '';
                setOtp(newOtp);
            }
            // Nếu ô hiện tại rỗng, nhảy lùi và xóa ô trước
            else if (index > 0) {
                newOtp[index - 1] = '';
                setOtp(newOtp);
                otpInputs.current[index - 1]?.focus();
            }
        }
    };

    // Handler for step 1: Send OTP
    const handleSendOtp = async () => {
        setError(null);

        if (!phone || phone.length < 10) {
            setError('Phone number must be at least 10 digits');
            return;
        }

        setLoading(true);
        try {
            await sendOtpForgetPassword(phone);
            setStep(2);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Handler for step 2: Verify OTP
    const handleVerifyOtp = async () => {
        setError(null);

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            await verifyOtpForgetPassword(phone, otpCode);
            setStep(3);
            setError(null);
            console.log('[handleVerifyOtp] OTP verified successfully');
        } catch (err: any) {
            let errorMessage = 'Invalid OTP';
            if (err instanceof Error) {
                errorMessage = err.message || 'Invalid OTP';
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err?.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handler for step 3: Reset Password
    const handleResetPassword = async () => {
        setError(null);

        if (!newPassword) {
            setError('Please enter your new password');
            return;
        }

        if (!confirmPassword) {
            setError('Please confirm your password');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const otpCode = otp.join('');
            await resetPassword({
                phoneNumber: phone,
                otp: otpCode,
                newPassword: newPassword,
                confirmPassword: confirmPassword,
            });

            Alert.alert(
                'Success',
                'Password reset successfully! Please log in.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/login' as any),
                    },
                ],
            );
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
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
                        Forgot Password
                    </Text>

                    {/* STEP 1 - phone */}
                    {step === 1 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                Enter your registered phone number to receive a
                                verification code.
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
                                    textAlignVertical="center"
                                    style={{
                                        height: 48,
                                        borderWidth: 1,
                                        borderColor: '#D1D5DB',
                                        borderRadius: 24,
                                        paddingHorizontal: 16,
                                        fontSize: 16,
                                        color: '#111827',
                                        backgroundColor: '#FFFFFF',
                                    }}
                                />
                            </View>

                            <Text className="text-center text-sm text-gray-400">
                                By tapping Next, you may receive an SMS for
                                verification. Message and data rates may apply.
                            </Text>
                        </>
                    )}

                    {/* STEP 2 - Verify OTP */}
                    {step === 2 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                We have sent a 6-digit code to your registered
                                mobile number{' '}
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
                                        onKeyPress={(e) =>
                                            handleKeyPress(e, index)
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

                            <Text className="text-center text-sm text-gray-400">
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

                    {/* STEP 3 - Reset Password */}
                    {step === 3 && (
                        <>
                            <Text className="text-center text-gray-400 mb-8">
                                Create a new password for your account.
                            </Text>

                            {/* Password */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                                    PASSWORD
                                </Text>
                                <View
                                    className="flex-row items-center border border-gray-300 rounded-full px-4 bg-white"
                                    style={{
                                        height: 48,
                                        borderRadius: 24,
                                    }}
                                >
                                    <TextInput
                                        placeholder="Enter password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showNewPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        textAlignVertical="center"
                                        style={{
                                            flex: 1,
                                            fontSize: 16,
                                            color: '#111827',
                                        }}
                                    />
                                    <Pressable
                                        onPress={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="p-2"
                                    >
                                        {showNewPassword ? (
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
                                <View
                                    className="flex-row items-center rounded-full px-4 bg-white"
                                    style={{
                                        height: 48,
                                        borderRadius: 24,
                                        borderWidth: 1,
                                        borderColor:
                                            confirmPassword &&
                                            newPassword &&
                                            confirmPassword === newPassword
                                                ? '#10B981'
                                                : confirmPassword &&
                                                    newPassword &&
                                                    confirmPassword !==
                                                        newPassword
                                                  ? '#EF4444'
                                                  : '#D1D5DB',
                                    }}
                                >
                                    <TextInput
                                        placeholder="Confirm password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        textAlignVertical="center"
                                        style={{
                                            flex: 1,
                                            fontSize: 16,
                                            color: '#111827',
                                        }}
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
                                    {/* ít nhất 8 ký tự */}
                                    <View className="flex-row items-center gap-3 mb-2">
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

                                    {/* ký tự đặc biệt */}
                                    <View className="flex-row items-center gap-3 mb-2">
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

                                    {/* số */}
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
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Fixed Button at Bottom */}
            <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
                {/* Error Message */}
                {error && (
                    <View className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                        <Text className="text-red-700 text-sm font-semibold">
                            {error}
                        </Text>
                    </View>
                )}

                {step === 1 && (
                    <Pressable
                        onPress={handleSendOtp}
                        disabled={loading}
                        className={`${loading ? 'bg-gray-400' : 'bg-[#2DB5B0]'} py-4 rounded-full items-center flex-row justify-center gap-2`}
                    >
                        {loading && <ActivityIndicator color="white" />}
                        <Text className="text-white text-lg font-semibold">
                            {loading ? 'Sending...' : 'Send OTP'}
                        </Text>
                    </Pressable>
                )}

                {step === 2 && (
                    <Pressable
                        onPress={handleVerifyOtp}
                        disabled={loading}
                        className={`${loading ? 'bg-gray-400' : 'bg-[#2DB5B0]'} py-4 rounded-full items-center flex-row justify-center gap-2`}
                    >
                        {loading && <ActivityIndicator color="white" />}
                        <Text className="text-white text-lg font-semibold">
                            {loading ? 'Verifying...' : 'Verify'}
                        </Text>
                    </Pressable>
                )}

                {step === 3 && (
                    <Pressable
                        onPress={handleResetPassword}
                        disabled={loading}
                        className={`${loading ? 'bg-gray-400' : 'bg-[#2DB5B0]'} py-4 rounded-full items-center flex-row justify-center gap-2`}
                    >
                        {loading && <ActivityIndicator color="white" />}
                        <Text className="text-white text-lg font-semibold">
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

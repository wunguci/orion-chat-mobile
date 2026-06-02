import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatApi } from '@/services/api/chat';
import {
    BarcodeScanningResult,
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#006275';

type ParsedQr =
    | { type: 'login'; token: string }
    | { type: 'group_join'; groupId: string };

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeGroupId(value: string | null | undefined): string {
    const groupId = String(value || '').trim();
    if (!groupId) return '';
    return /^[a-zA-Z0-9_-]{8,80}$/.test(groupId) || UUID_PATTERN.test(groupId)
        ? groupId
        : '';
}

function extractGroupIdFromPath(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    const groupIndex = parts.findIndex((part) =>
        ['group', 'groups', 'chat', 'conversation'].includes(
            part.toLowerCase(),
        ),
    );

    if (groupIndex >= 0) {
        return normalizeGroupId(parts[groupIndex + 1]);
    }

    const joinIndex = parts.findIndex((part) =>
        ['join-group', 'group-join'].includes(part.toLowerCase()),
    );

    if (joinIndex >= 0) {
        return normalizeGroupId(parts[joinIndex + 1]);
    }

    return '';
}

function parseScannedQr(rawValue: string): ParsedQr | null {
    const value = rawValue.trim();
    if (!value) return null;

    try {
        const json = JSON.parse(value) as {
            type?: unknown;
            groupId?: unknown;
            conversationId?: unknown;
            token?: unknown;
            qrToken?: unknown;
            qrData?: unknown;
        };

        const jsonGroupId = normalizeGroupId(
            typeof json.groupId === 'string'
                ? json.groupId
                : typeof json.conversationId === 'string'
                  ? json.conversationId
                  : '',
        );

        if (
            jsonGroupId &&
            (json.type === 'group_join' ||
                json.type === 'join_group' ||
                json.type === 'group_invite' ||
                json.type === 'group')
        ) {
            return { type: 'group_join', groupId: jsonGroupId };
        }

        if (typeof json.qrData === 'string') {
            const nested = parseScannedQr(json.qrData);
            if (nested) return nested;
        }

        const jsonToken =
            typeof json.qrToken === 'string'
                ? json.qrToken
                : typeof json.token === 'string'
                  ? json.token
                  : '';

        if (jsonToken) return { type: 'login', token: jsonToken };
    } catch {
        // Not JSON, continue with URL/plain token parsing.
    }

    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        const groupId =
            normalizeGroupId(url.searchParams.get('groupId')) ||
            normalizeGroupId(url.searchParams.get('conversationId')) ||
            (['group', 'groups', 'join-group', 'group-join'].includes(host)
                ? normalizeGroupId(url.pathname.split('/').filter(Boolean)[0])
                : '') ||
            extractGroupIdFromPath(url.pathname);

        if (
            groupId &&
            (url.protocol === 'orionchatmobile:' ||
                host.includes('orion') ||
                url.pathname.includes('join-group') ||
                url.pathname.includes('group-join') ||
                url.pathname.includes('/groups/'))
        ) {
            return { type: 'group_join', groupId };
        }

        const token =
            url.searchParams.get('token') || url.searchParams.get('qrToken');
        if (
            token &&
            (url.protocol === 'orionchatmobile:' ||
                url.pathname.includes('qr-login') ||
                url.hostname.includes('qr-login'))
        ) {
            return { type: 'login', token };
        }

        if (
            url.protocol === 'orionchatmobile:' &&
            url.hostname.includes('qr-login')
        ) {
            const pathToken = url.pathname.replace(/^\//, '');
            if (pathToken)
                return { type: 'login', token: decodeURIComponent(pathToken) };
        }
    } catch {
        // Plain token fallback for development QR values.
    }

    if (UUID_PATTERN.test(value)) {
        return { type: 'group_join', groupId: value };
    }

    return value.length >= 20 && !value.includes(' ')
        ? { type: 'login', token: value }
        : null;
}

export default function QrScanScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const scannedRef = useRef(false);
    const handledGroupIdsRef = useRef(new Set<string>());

    const resetScanner = useCallback(() => {
        handledGroupIdsRef.current.clear();
        scannedRef.current = false;
        setScanned(false);
    }, []);

    const submitGroupJoin = useCallback(
        async (groupId: string) => {
            try {
                const result = await chatApi.joinGroup(
                    groupId,
                    'Joined from mobile QR scan',
                );

                if (result.status === 'pending_approval') {
                    Alert.alert(
                        'Request sent',
                        'Your request has been sent to the group admins.',
                        [{ text: 'OK', onPress: () => router.back() }],
                    );
                    return;
                }

                router.replace({
                    pathname: '/chat/[id]',
                    params: { id: groupId },
                });
            } catch (error) {
                handledGroupIdsRef.current.delete(groupId);
                Alert.alert(
                    'Unable to join group',
                    error instanceof Error
                        ? error.message
                        : 'Please try again.',
                    [{ text: 'Scan again', onPress: resetScanner }],
                );
            }
        },
        [resetScanner, router],
    );

    const joinScannedGroup = useCallback(
        async (groupId: string) => {
            if (handledGroupIdsRef.current.has(groupId)) return;

            try {
                const detail = await chatApi.getGroupDetail(groupId);
                const groupName = detail.groupName || 'this group';

                if (detail.isMember) {
                    handledGroupIdsRef.current.add(groupId);
                    Alert.alert('Already in group', `You are already a member of ${groupName}.`, [
                        {
                            text: 'Open Group',
                            onPress: () =>
                                router.replace({
                                    pathname: '/chat/[id]',
                                    params: { id: groupId },
                                }),
                        },
                        {
                            text: 'Scan again',
                            onPress: resetScanner,
                        },
                    ]);
                    return;
                }

                if (detail.myJoinRequestStatus === 'pending') {
                    handledGroupIdsRef.current.add(groupId);
                    Alert.alert(
                        'Request pending',
                        `Your request to join ${groupName} is already waiting for approval.`,
                        [{ text: 'OK', onPress: () => router.back() }],
                    );
                    return;
                }

                Alert.alert(
                    'Join Group',
                    detail.joinRequireApproval
                        ? `Send a request to join ${groupName}?`
                        : `Join ${groupName}?`,
                    [
                        { text: 'Cancel', style: 'cancel', onPress: resetScanner },
                        {
                            text: detail.joinRequireApproval
                                ? 'Send Request'
                                : 'Join',
                            onPress: () => {
                                handledGroupIdsRef.current.add(groupId);
                                scannedRef.current = true;
                                setScanned(true);
                                setTimeout(() => {
                                    void submitGroupJoin(groupId);
                                }, 0);
                            },
                        },
                    ],
                );
            } catch (error) {
                Alert.alert(
                    'Invalid group QR',
                    error instanceof Error
                        ? error.message
                        : 'Could not read this group QR code.',
                    [{ text: 'Scan again', onPress: resetScanner }],
                );
            }
        },
        [resetScanner, router, submitGroupJoin],
    );

    const processScannedValue = useCallback(
        (rawValue: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            setScanned(true);

            const parsed = parseScannedQr(rawValue || '');
            if (!parsed) {
                Alert.alert(
                    'Invalid QR Code',
                    'This is not an Orion Chat login or group invite QR code.',
                    [{ text: 'Scan again', onPress: resetScanner }],
                );
                return;
            }

            if (parsed.type === 'login') {
                router.replace({
                    pathname: '/qr-login',
                    params: { token: parsed.token },
                });
                return;
            }

            void joinScannedGroup(parsed.groupId);
        },
        [joinScannedGroup, resetScanner, router],
    );

    const handleBarcodeScanned = useCallback(
        (result: BarcodeScanningResult) => {
            processScannedValue(result.data || result.raw || '');
        },
        [processScannedValue],
    );

    useEffect(() => {
        const subscription = CameraView.onModernBarcodeScanned((result) => {
            processScannedValue(result.data || result.raw || '');
        });

        return () => {
            subscription.remove();
        };
    }, [processScannedValue]);

    const openSystemScanner = useCallback(async () => {
        if (scannedRef.current) return;

        try {
            await CameraView.launchScanner({
                barcodeTypes: ['qr'],
                isGuidanceEnabled: true,
                isHighlightingEnabled: true,
            });
        } catch (error) {
            Alert.alert(
                'Unable to open scanner',
                error instanceof Error ? error.message : 'Please try again.',
            );
        }
    }, [scanned]);

    const openSettings = () => {
        void Linking.openSettings();
    };

    if (!permission) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text>Checking camera permissions...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    paddingTop: Math.max(insets.top, 20),
                    paddingHorizontal: 24,
                    justifyContent: 'center',
                }}
            >
                <MaterialCommunityIcons
                    name="camera-outline"
                    size={54}
                    color={PRIMARY}
                    style={{ alignSelf: 'center', marginBottom: 18 }}
                />
                <Text
                    style={{
                        color: '#111827',
                        fontSize: 22,
                        fontWeight: '800',
                        textAlign: 'center',
                    }}
                >
                    Camera Permission Required
                </Text>
                <Text
                    style={{
                        color: '#6b7280',
                        fontSize: 14,
                        lineHeight: 21,
                        textAlign: 'center',
                        marginTop: 10,
                    }}
                >
                    Orion Chat needs camera access to scan the web login QR code.
                </Text>
                <TouchableOpacity
                    onPress={
                        permission.canAskAgain
                            ? requestPermission
                            : openSettings
                    }
                    activeOpacity={0.8}
                    style={{
                        marginTop: 26,
                        minHeight: 48,
                        borderRadius: 24,
                        backgroundColor: PRIMARY,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: '800',
                        }}
                    >
                        {permission.canAskAgain
                            ? 'Grant Camera Permission'
                            : 'Open Settings'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginTop: 16, alignItems: 'center' }}
                >
                    <Text style={{ color: '#6b7280', fontWeight: '700' }}>
                        Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                autofocus="on"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                onMountError={(error) => {
                    Alert.alert(
                        'Unable to open camera',
                        error.message || 'Please verify camera permissions.',
                    );
                }}
            />

            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <View
                    style={{
                        width: 250,
                        height: 250,
                        borderWidth: 3,
                        borderColor: '#fff',
                        borderRadius: 18,
                        backgroundColor: 'transparent',
                    }}
                />
            </View>

            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    paddingTop: Math.max(
                        insets.top,
                        Platform.OS === 'ios' ? 44 : 20,
                    ),
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.75}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={25}
                        color="#fff"
                    />
                </TouchableOpacity>
                <Text
                    style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}
                >
                    Scan QR
                </Text>
                <View style={{ width: 42 }} />
            </View>

            <View
                style={{
                    position: 'absolute',
                    left: 24,
                    right: 24,
                    bottom: Math.max(insets.bottom + 26, 40),
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    padding: 16,
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: '800',
                        textAlign: 'center',
                    }}
                >
                    Align the QR code inside the frame
                </Text>
                <Text
                    style={{
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 13,
                        lineHeight: 19,
                        textAlign: 'center',
                        marginTop: 6,
                    }}
                >
                    Scan a web login QR or a group invite QR to continue.
                </Text>
                <TouchableOpacity
                    onPress={openSystemScanner}
                    activeOpacity={0.8}
                    style={{
                        marginTop: 12,
                        minHeight: 40,
                        borderRadius: 20,
                        backgroundColor: PRIMARY,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: '800',
                        }}
                    >
                        Open System QR Scanner
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

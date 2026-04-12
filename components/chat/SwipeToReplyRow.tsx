import React, { useMemo, useRef } from 'react';
import {
    Animated,
    PanResponder,
    Platform,
    StyleSheet,
    View,
} from 'react-native';

interface SwipeToReplyRowProps {
    children: React.ReactNode;
    onReply: () => void;
    enabled?: boolean;
}

const THRESHOLD = 72;

export default function SwipeToReplyRow({
    children,
    onReply,
    enabled = true,
}: SwipeToReplyRowProps) {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    if (!enabled) {
                        return false;
                    }

                    return (
                        gestureState.dx > 10 &&
                        Math.abs(gestureState.dy) < 10 &&
                        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
                    );
                },
                onPanResponderMove: (_, gestureState) => {
                    if (!enabled) {
                        return;
                    }

                    const next = Math.max(0, Math.min(gestureState.dx, 96));
                    translateX.setValue(next);
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (!enabled) {
                        return;
                    }

                    if (
                        gestureState.dx >= THRESHOLD &&
                        Math.abs(gestureState.dy) < 20
                    ) {
                        onReply();
                    }

                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                        speed: 22,
                    }).start();
                },
                onPanResponderTerminate: () => {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                        speed: 22,
                    }).start();
                },
            }),
        [enabled, onReply, translateX],
    );

    return (
        <View style={styles.container}>
            {/* <View
                style={[
                    styles.replyIcon,
                    {
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Ionicons
                    name="arrow-undo-outline"
                    size={16}
                    color={colors.textSecondary}
                />
            </View> */}

            <Animated.View
                style={{
                    transform: [{ translateX }],
                }}
                {...(Platform.OS === 'ios'
                    ? panResponder.panHandlers
                    : panResponder.panHandlers)}
            >
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    replyIcon: {
        position: 'absolute',
        left: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
});

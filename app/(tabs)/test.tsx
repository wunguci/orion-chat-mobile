import { StyleSheet, Text, View } from 'react-native';

export default function TestScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                Test Screen - If you see this, basic routing works!
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        color: '#000',
    },
});

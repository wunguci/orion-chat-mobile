import { Linking, Alert } from 'react-native';

export const downloadFileDirectly = async (
    fileUri: string,
    fileName: string,
) => {
    try {
        console.log('[FileDownload] Downloading:', { fileUri, fileName });
        await Linking.openURL(fileUri);
        return { success: true, message: `Đang tải: ${fileName}` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[FileDownload] Error:', msg);
        return { success: false, message: `Tải thất bại: ${msg}` };
    }
};

export const showDownloadAlert = (result: {
    success: boolean;
    message: string;
}) => {
    Alert.alert(result.success ? 'Thành công' : 'Lỗi', result.message);
};

import { Linking, Alert } from 'react-native';

export const downloadFileDirectly = async (
    fileUri: string,
    fileName: string,
) => {
    try {
        console.log('[FileDownload] Downloading:', { fileUri, fileName });
        await Linking.openURL(fileUri);
        return { success: true, message: `Downloading: ${fileName}` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[FileDownload] Error:', msg);
        return { success: false, message: `Download failed: ${msg}` };
    }
};

export const showDownloadAlert = (result: {
    success: boolean;
    message: string;
}) => {
    Alert.alert(result.success ? 'Success' : 'Error', result.message);
};

/* eslint-disable */
import { Platform } from 'react-native';

let Icons: any;

if (Platform.OS === 'web') {
    Icons = require('lucide-react');
} else {
    Icons = require('lucide-react-native');
}

export const { Eye, EyeOff } = Icons;

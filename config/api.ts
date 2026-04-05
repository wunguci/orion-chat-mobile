let API_BASE_URL = 'http://localhost:3000';

if (__DEV__) {
    // đổi thành ip lap để chạy Expo go
    API_BASE_URL = 'http://192.168.1.4:3000';
}

export default API_BASE_URL;

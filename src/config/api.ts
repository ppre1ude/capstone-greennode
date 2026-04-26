import {Platform} from 'react-native';

const PORT = 8080;

// Android 실기기에서 테스트할 때는 SSH 터널을 연 PC의 LAN IP를 넣어주세요.
// 예: const ANDROID_DEVICE_HOST = '192.168.0.12';
const ANDROID_DEVICE_HOST = '';

const androidHost = ANDROID_DEVICE_HOST || '10.0.2.2';

export const API_BASE_URL =
  Platform.OS === 'android'
    ? `http://${androidHost}:${PORT}`
    : `http://localhost:${PORT}`;

// Presentation/dev fallback: skip the live Vision AI upload pipeline.
// Set to false when the backend image pipeline is ready to test again.
export const USE_MOCK_AI_PIPELINE = true;

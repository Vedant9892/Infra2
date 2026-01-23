// constants/api.ts
import { Platform } from 'react-native';

// Replace this with YOUR computer's IP address
const DEV_IP = '192.168.0.100'; // ← Change this to your IP from ipconfig

export const API_BASE_URL = Platform.select({
  // For iOS simulator, localhost works
  ios: __DEV__ ? `http://localhost:4000` : `http://${DEV_IP}:4000`,
  // For Android emulator and real devices, use IP
  android: `http://${DEV_IP}:4000`,
  // For web
  default: 'http://localhost:4000',
});

console.log('🌐 API Base URL:', API_BASE_URL);



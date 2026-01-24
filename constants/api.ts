// constants/api.ts
import { Platform } from 'react-native';

// Replace this with YOUR computer's IP address
const DEV_IP = '172.16.3.248'; // ← Change this to your IP from ipconfig

export const API_BASE_URL = Platform.select({
  // For iOS simulator, localhost works
  ios: __DEV__ ? `http://${DEV_IP}:3001` : `http://${DEV_IP}:3001`,
  // For Android emulator and real devices, use IP
  android: `http://${DEV_IP}:3001`,
  // For web
  default: 'http://localhost:3001',
});

console.log('🌐 API Base URL:', API_BASE_URL);

export const USER = {
  UPDATE_PROFILE: '/api/users/update-profile',
};

export const LABOUR_ENDPOINTS = {
  SITE: {
    JOIN: '/api/sites/join',
    GET_MY_SITES: '/api/sites/my-sites',
    GET_DETAILS: (siteId: string) => `/api/sites/${siteId}`,
    DOCUMENTATION: (siteId: string) => `/api/sites/${siteId}/documentation`,
  },
  TASK: {
    GET_ASSIGNED: (siteId: string) => `/api/tasks/site/${siteId}/assigned`,
    GET_DETAILS: (taskId: string) => `/api/tasks/${taskId}`,
    UPDATE_STATUS: (taskId: string) => `/api/tasks/${taskId}/status`,
    UPLOAD_IMAGE: (taskId: string) => `/api/tasks/${taskId}/upload-image`,
  },
  ATTENDANCE: {
    MARK: '/api/attendance/mark',
    GET_TODAY: (siteId: string) => `/api/attendance/site/${siteId}/today`,
    GET_HISTORY: (siteId: string) => `/api/attendance/site/${siteId}/history`,
  },
  MESSAGE: {
    SEND: '/api/messages/send',
    GET_SITE_MESSAGES: (siteId: string) => `/api/messages/site/${siteId}`,
    MARK_READ: (siteId: string) => `/api/messages/mark-read/${siteId}`,
  },
  DASHBOARD: {
    GET_DATA: (siteId: string) => `/api/dashboard/site/${siteId}`,
  },
  TOOLS: {
    LIST_BY_SITE: (siteId: string) => `/api/tools/site/${siteId}`,
    MY_REQUESTS: (siteId: string) => `/api/tools/my-requests/${siteId}`,
    REQUEST: '/api/tools/request',
    RETURN: (requestId: string) => `/api/tools/return/${requestId}`,
  },
};

export const STOCK_ENDPOINTS = {
  GET_ALL: (siteId: string) => `/api/stock/${siteId}`,
  CREATE: '/api/stock',
  UPDATE: (id: string) => `/api/stock/${id}`,
  DELETE: (id: string) => `/api/stock/${id}`,
};

export const BILLS_ENDPOINTS = {
  GET_ALL: (siteId: string) => `/api/bills/${siteId}`,
  CREATE: '/api/bills',
  UPDATE: (id: string) => `/api/bills/${id}`,
  DELETE: (id: string) => `/api/bills/${id}`,
  OCR: '/api/bills/ocr',
};

// constants/api.ts
import { Platform } from 'react-native';

// Replace this with YOUR computer's IP address
const DEV_IP = '172.16.34.187'; // ← Change this to your IP from ipconfig

export const API_BASE_URL = Platform.select({
  // For iOS simulator, localhost works
  ios: __DEV__ ? `http://${DEV_IP}:3001` : `http://${DEV_IP}:3001`,
  // For Android emulator and real devices, use IP
  android: `http://${DEV_IP}:3001`,
  // For web
  default: 'http://172.16.34.187:3001',
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

// === NEW FEATURE ENDPOINTS ===

export const CONTRACTOR_ENDPOINTS = {
  GET_ALL: '/api/contractors',
  GET_BY_ID: (id: number) => `/api/contractors/${id}`,
  CREATE: '/api/contractors',
  UPDATE_RATING: (id: number) => `/api/contractors/${id}/rating`,
  PROJECT_COMPLETE: (id: number) => `/api/contractors/${id}/project-complete`,
  RECORD_DEFECT: (id: number) => `/api/contractors/${id}/defect`,
};

export const FACE_RECALL_ENDPOINTS = {
  GET_WAGERS: '/api/daily-wagers',
  GET_WAGER_BY_ID: (id: number) => `/api/daily-wagers/${id}`,
  CREATE_WAGER: '/api/daily-wagers',
  UPDATE_FACE: (id: number) => `/api/daily-wagers/${id}/face`,
  RECOGNIZE: '/api/face-recall/recognize',
  GET_ATTENDANCE: '/api/face-attendance',
};

export const TOOL_ENDPOINTS = {
  GET_ALL: '/api/tools',
  GET_BY_ID: (id: number) => `/api/tools/${id}`,
  GET_BY_QR: (qrCode: string) => `/api/tools/qr/${qrCode}`,
  CREATE: '/api/tools',
  REQUEST: '/api/tools/request',
  GET_REQUESTS: '/api/tools/requests',
  APPROVE_REQUEST: (id: number) => `/api/tools/requests/${id}/approve`,
  RETURN: (id: number) => `/api/tools/requests/${id}/return`,
  SCAN_QR: '/api/tools/scan-qr',
};

export const PERMIT_ENDPOINTS = {
  GET_ALL: '/api/permits',
  GET_BY_ID: (id: number) => `/api/permits/${id}`,
  REQUEST: '/api/permits/request',
  VERIFY: (id: number) => `/api/permits/${id}/verify`,
  REJECT: (id: number) => `/api/permits/${id}/reject`,
};

export const PETTY_CASH_ENDPOINTS = {
  GET_ALL: '/api/petty-cash',
  GET_BY_ID: (id: number) => `/api/petty-cash/${id}`,
  CREATE: '/api/petty-cash',
  VALIDATE_GPS: '/api/petty-cash/validate-gps',
  APPROVE: (id: number) => `/api/petty-cash/${id}/approve`,
  REJECT: (id: number) => `/api/petty-cash/${id}/reject`,
};

export const CONSUMPTION_VARIANCE_ENDPOINTS = {
  GET_ALL: '/api/consumption-variance',
  GET_BY_ID: (id: number) => `/api/consumption-variance/${id}`,
  CREATE: '/api/consumption-variance',
  UPDATE_ACTUAL: (id: number) => `/api/consumption-variance/${id}/actual`,
};

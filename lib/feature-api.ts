/**
 * API client for new features
 * Uses API_BASE_URL from constants/api.ts
 */

import { API_BASE_URL } from '../constants/api';
import {
  CONTRACTOR_ENDPOINTS,
  FACE_RECALL_ENDPOINTS,
  TOOL_ENDPOINTS,
  PERMIT_ENDPOINTS,
  PETTY_CASH_ENDPOINTS,
  CONSUMPTION_VARIANCE_ENDPOINTS,
} from '../constants/api';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ===== CONTRACTOR RATING & MANAGEMENT =====

export const contractorApi = {
  getAll: (siteId?: number) => {
    const url = siteId 
      ? `${CONTRACTOR_ENDPOINTS.GET_ALL}?siteId=${siteId}`
      : CONTRACTOR_ENDPOINTS.GET_ALL;
    return apiCall(url);
  },

  getById: (id: number) => 
    apiCall(CONTRACTOR_ENDPOINTS.GET_BY_ID(id)),

  create: (data: {
    name: string;
    companyName?: string;
    phone?: string;
    email?: string;
    siteId?: number;
  }) => 
    apiCall(CONTRACTOR_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRating: (id: number, data: {
    deadlinesMet?: number;
    totalProjects?: number;
    defectCount?: number;
  }) => 
    apiCall(CONTRACTOR_ENDPOINTS.UPDATE_RATING(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  recordProjectComplete: (id: number, onTime: boolean) => 
    apiCall(CONTRACTOR_ENDPOINTS.PROJECT_COMPLETE(id), {
      method: 'POST',
      body: JSON.stringify({ onTime }),
    }),

  recordDefect: (id: number) => 
    apiCall(CONTRACTOR_ENDPOINTS.RECORD_DEFECT(id), {
      method: 'POST',
    }),
};

// ===== FACE-RECALL FOR DAILY WAGERS =====

export const faceRecallApi = {
  getWagers: (siteId?: number) => {
    const url = siteId 
      ? `${FACE_RECALL_ENDPOINTS.GET_WAGERS}?siteId=${siteId}`
      : FACE_RECALL_ENDPOINTS.GET_WAGERS;
    return apiCall(url);
  },

  getWagerById: (id: number) => 
    apiCall(FACE_RECALL_ENDPOINTS.GET_WAGER_BY_ID(id)),

  createWager: (data: {
    name: string;
    phone?: string;
    role?: string;
    siteId?: number;
    dailyWage?: string;
    photoUri?: string;
    faceEncoding?: string;
  }) => 
    apiCall(FACE_RECALL_ENDPOINTS.CREATE_WAGER, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFace: (id: number, data: {
    faceEncoding?: string;
    photoUri?: string;
  }) => 
    apiCall(FACE_RECALL_ENDPOINTS.UPDATE_FACE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  recognize: (data: {
    photoUri: string;
    faceEncoding?: string;
    gpsLat?: string;
    gpsLon?: string;
    address?: string;
    confidence?: string;
  }) => 
    apiCall(FACE_RECALL_ENDPOINTS.RECOGNIZE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAttendance: (wagerId?: number, siteId?: number) => {
    const params = new URLSearchParams();
    if (wagerId) params.append('wagerId', wagerId.toString());
    if (siteId) params.append('siteId', siteId.toString());
    const url = params.toString() 
      ? `${FACE_RECALL_ENDPOINTS.GET_ATTENDANCE}?${params}`
      : FACE_RECALL_ENDPOINTS.GET_ATTENDANCE;
    return apiCall(url);
  },
};

// ===== TOOL LIBRARY =====

export const toolApi = {
  getAll: (siteId?: number) => {
    const url = siteId 
      ? `${TOOL_ENDPOINTS.GET_ALL}?siteId=${siteId}`
      : TOOL_ENDPOINTS.GET_ALL;
    return apiCall(url);
  },

  getById: (id: number) => 
    apiCall(TOOL_ENDPOINTS.GET_BY_ID(id)),

  getByQR: (qrCode: string) => 
    apiCall(TOOL_ENDPOINTS.GET_BY_QR(qrCode)),

  create: (data: {
    name: string;
    description?: string;
    siteId: number;
    quantity?: number;
  }) => 
    apiCall(TOOL_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  request: (data: {
    toolId: number;
    userId: number;
    siteId: number;
    requestedDuration?: string;
  }) => 
    apiCall(TOOL_ENDPOINTS.REQUEST, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRequests: (userId?: number, siteId?: number) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (siteId) params.append('siteId', siteId.toString());
    const url = params.toString() 
      ? `${TOOL_ENDPOINTS.GET_REQUESTS}?${params}`
      : TOOL_ENDPOINTS.GET_REQUESTS;
    return apiCall(url);
  },

  approveRequest: (id: number, approvedBy?: number) => 
    apiCall(TOOL_ENDPOINTS.APPROVE_REQUEST(id), {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    }),

  return: (id: number) => 
    apiCall(TOOL_ENDPOINTS.RETURN(id), {
      method: 'POST',
    }),

  scanQR: (data: {
    qrCode: string;
    userId: number;
    action: 'checkout' | 'return';
  }) => 
    apiCall(TOOL_ENDPOINTS.SCAN_QR, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===== OTP PERMIT-TO-WORK =====

export const permitApi = {
  getAll: (siteId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (siteId) params.append('siteId', siteId.toString());
    if (status) params.append('status', status);
    const url = params.toString() 
      ? `${PERMIT_ENDPOINTS.GET_ALL}?${params}`
      : PERMIT_ENDPOINTS.GET_ALL;
    return apiCall(url);
  },

  getById: (id: number) => 
    apiCall(PERMIT_ENDPOINTS.GET_BY_ID(id)),

  request: (data: {
    taskName: string;
    workerId: number;
    workerName?: string;
    siteId: number;
  }) => 
    apiCall(PERMIT_ENDPOINTS.REQUEST, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verify: (id: number, data: {
    otp: string;
    verifiedBy: number;
  }) => 
    apiCall(PERMIT_ENDPOINTS.VERIFY(id), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reject: (id: number, data: {
    rejectionReason: string;
    rejectedBy?: number;
  }) => 
    apiCall(PERMIT_ENDPOINTS.REJECT(id), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===== PETTY CASH WALLET =====

export const pettyCashApi = {
  getAll: (userId?: number, siteId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (siteId) params.append('siteId', siteId.toString());
    if (status) params.append('status', status);
    const url = params.toString() 
      ? `${PETTY_CASH_ENDPOINTS.GET_ALL}?${params}`
      : PETTY_CASH_ENDPOINTS.GET_ALL;
    return apiCall(url);
  },

  getById: (id: number) => 
    apiCall(PETTY_CASH_ENDPOINTS.GET_BY_ID(id)),

  create: (data: {
    userId: number;
    siteId?: number;
    amount: string;
    purpose: string;
    receiptUri?: string | null;
    gpsLat: string;
    gpsLon: string;
    address: string;
  }) => 
    apiCall(PETTY_CASH_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  validateGPS: (data: {
    gpsLat: string;
    gpsLon: string;
    siteId?: number;
  }) => 
    apiCall(PETTY_CASH_ENDPOINTS.VALIDATE_GPS, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: number, approvedBy: number) => 
    apiCall(PETTY_CASH_ENDPOINTS.APPROVE(id), {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    }),

  reject: (id: number, data: {
    rejectionReason: string;
    rejectedBy?: number;
  }) => 
    apiCall(PETTY_CASH_ENDPOINTS.REJECT(id), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===== CONSUMPTION VARIANCE =====

export const consumptionVarianceApi = {
  getAll: (siteId?: number) => {
    const url = siteId 
      ? `${CONSUMPTION_VARIANCE_ENDPOINTS.GET_ALL}?siteId=${siteId}`
      : CONSUMPTION_VARIANCE_ENDPOINTS.GET_ALL;
    return apiCall(url);
  },

  getById: (id: number) => 
    apiCall(CONSUMPTION_VARIANCE_ENDPOINTS.GET_BY_ID(id)),

  create: (data: {
    siteId: number;
    materialName: string;
    theoreticalQty: string;
    actualQty: string;
    unit: string;
    alertThreshold?: string;
  }) => 
    apiCall(CONSUMPTION_VARIANCE_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateActual: (id: number, actualQty: string) => 
    apiCall(CONSUMPTION_VARIANCE_ENDPOINTS.UPDATE_ACTUAL(id), {
      method: 'PATCH',
      body: JSON.stringify({ actualQty }),
    }),
};

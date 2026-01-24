/**
 * PS02-CFMA mock API – frontend only. No backend calls.
 * All functions read/write lib/mock-data.
 * Triggers data sync across all dashboards.
 */

import {
  mockData,
  type WorkLog,
  type MaterialRequestMock,
  type TaskMock,
  type StockItemMock,
  type PettyCashMock,
  type PermitOTPMock,
  type ToolRequestMock,
  type SiteMock,
} from './mock-data';

const siteId = () => mockData.defaultSiteId();

// Global refresh trigger for cross-dashboard communication
let refreshListeners: Set<() => void> = new Set();

export function onDataChange(callback: () => void) {
  refreshListeners.add(callback);
  return () => {
    refreshListeners.delete(callback);
  };
}

function triggerRefresh() {
  refreshListeners.forEach((cb) => cb());
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Sites (Labour join, Owner list, Projects)
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getSitesForLabour(userId: string): { id: string; name: string; address?: string; status: string }[] {
  const map = mockData.labourSitesMap();
  const ids = map[userId] ?? map['default'] ?? ['s1'];
  const sites = mockData.sites();
  return ids.map((id) => {
    const s = sites.find((x) => x.id === id);
    return s ? { id: s.id, name: s.name, address: s.address, status: s.status } : { id, name: 'Site', address: '', status: 'active' };
  });
}

export function getSitesForOwner(_ownerId: string): { id: string; name: string; address?: string; status: string }[] {
  return mockData.sites().map((s) => ({ id: s.id, name: s.name, address: s.address, status: s.status }));
}

export function joinSiteByCode(code: string, userId: string, userRole?: string): { success: boolean; site?: { id: string; name: string; address?: string } } {
  const sites = mockData.sites();
  
  // Try to parse QR code data if it's JSON
  let enrollmentCode = code.trim().toUpperCase();
  try {
    const qrData = JSON.parse(code);
    if (qrData.type === 'site_enrollment' && qrData.enrollmentCode) {
      enrollmentCode = qrData.enrollmentCode.toUpperCase();
    }
  } catch {
    // Not JSON, use as plain code
  }
  
  const site = sites.find((s) => (s.enrollmentCode ?? '').toUpperCase() === enrollmentCode);
  if (!site) return { success: false };
  
  // Add site to user's site list (works for all roles: labour, supervisor, engineer, etc.)
  const map = { ...mockData.labourSitesMap() };
  const current = map[userId] ?? [];
  if (!current.includes(site.id)) {
    map[userId] = [...current, site.id];
    mockData.setLabourSitesMap(map);
    triggerRefresh();
  }
  return { success: true, site: { id: site.id, name: site.name, address: site.address } };
}

// Create a new site with enrollment code
export function createSite(
  ownerId: string,
  name: string,
  address: string,
  enrollmentCode?: string
): { id: string; name: string; address: string; enrollmentCode: string } {
  const sites = mockData.sites();
  
  // Generate enrollment code if not provided
  const code = enrollmentCode || `SITE-${String.fromCharCode(65 + (sites.length % 26))}${(sites.length + 1)}`;
  
  const newSite: SiteMock = {
    id: `s${sites.length + 1}`,
    name,
    address,
    status: 'active',
    enrollmentCode: code,
  };
  
  const updatedSites = [...sites, newSite];
  mockData.setSites(updatedSites);
  triggerRefresh();
  
  return {
    id: newSite.id,
    name: newSite.name,
    address: newSite.address || '',
    enrollmentCode: newSite.enrollmentCode || code,
  };
}

// Get site by ID
export function getSiteById(siteId: string): SiteMock | undefined {
  return mockData.sites().find((s) => s.id === siteId);
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Site documentation (work photos)
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getWorkPhotos(siteId: string): { id: string; photoUrl: string; timestamp: string; userId?: string }[] {
  return mockData.workPhotos().filter((p) => p.siteId === siteId).map((p) => ({ id: p.id, photoUrl: p.photoUrl, timestamp: p.timestamp, userId: p.userId }));
}

export function approveWorkPhoto(photoId: string, approved: boolean): void {
  // In a real app, this would update the status in the database
  // For mock, we'll just trigger refresh
  triggerRefresh();
}

export function approveWorkLog(logId: string, approved: boolean): void {
  // In a real app, this would update the status in the database
  // For mock, we'll just trigger refresh
  triggerRefresh();
}

export function addWorkPhoto(siteId: string, userId: string, photoUrl: string): void {
  const next = { id: `wp-${Date.now()}`, siteId, userId, photoUrl, timestamp: new Date().toISOString() };
  mockData.setWorkPhotos([...mockData.workPhotos(), next]);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Daily Work Logs
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getWorkLogs(sid?: string): WorkLog[] {
  const s = sid || siteId();
  return mockData.workLogs().filter((w) => w.siteId === s);
}

export function addWorkLog(
  userId: string,
  workDone: string,
  photoUri: string | null,
  lat: number,
  lon: number,
  address: string,
  sid?: string
): WorkLog {
  const s = sid || siteId();
  const next: WorkLog = {
    id: `wl-${Date.now()}`,
    siteId: s,
    userId,
    workDone,
    photoUri,
    lat,
    lon,
    address,
    timestamp: new Date().toISOString(),
  };
  const logs = [...mockData.workLogs(), next];
  mockData.setWorkLogs(logs);
  return next;
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Location-Based Attendance
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getAttendancePending(sid?: string) {
  const s = sid || siteId();
  return mockData.attendance().filter((a) => a.siteId === s && a.status === 'pending');
}

export function getAttendanceApproved(sid?: string) {
  const s = sid || siteId();
  return mockData.attendance().filter((a) => a.siteId === s && a.status === 'approved');
}

export function markAttendance(
  userId: string,
  photoUri: string,
  lat: number,
  lon: number,
  address: string,
  sid?: string
) {
  const s = sid || siteId();
  const next = {
    id: `a-${Date.now()}`,
    userId,
    siteId: s,
    timestamp: new Date().toISOString(),
    photoUri,
    lat,
    lon,
    address,
    status: 'pending' as const,
  };
  const list = [...mockData.attendance(), next];
  mockData.setAttendance(list);
  triggerRefresh();
  return next;
}

export function approveAttendance(id: string, approve: boolean) {
  const list = mockData.attendance().map((a) =>
    a.id === id ? { ...a, status: approve ? ('approved' as const) : ('rejected' as const) } : a
  );
  mockData.setAttendance(list);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Material Ordering
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getMaterialRequests(sid?: string): MaterialRequestMock[] {
  const s = sid || siteId();
  return mockData.materialRequests().filter((m) => m.id); // all for now, filter by site if stored
}

export function requestMaterial(
  requestedBy: string,
  requestedByRole: string,
  materialName: string,
  quantity: number,
  unit: string,
  priority: 'low' | 'medium' | 'high',
  reason: string,
  rate?: number
): MaterialRequestMock {
  const next: MaterialRequestMock = {
    id: `mr-${Date.now()}`,
    requestedBy,
    requestedByRole,
    materialName,
    quantity,
    unit,
    rate,
    priority,
    status: 'pending',
    reason,
    timestamp: new Date().toISOString(),
  };
  const list = [...mockData.materialRequests(), next];
  mockData.setMaterialRequests(list);
  triggerRefresh();
  return next;
}

export function approveMaterialRequest(id: string, approved: boolean, approvedBy?: string, rejectionReason?: string) {
  const list = mockData.materialRequests().map((m) =>
    m.id === id
      ? {
          ...m,
          status: approved ? ('approved' as const) : ('rejected' as const),
          approvedBy: approved ? approvedBy : undefined,
          rejectionReason: approved ? undefined : rejectionReason,
        }
      : m
  );
  mockData.setMaterialRequests(list);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Task Lists
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getTasks(sid?: string): TaskMock[] {
  const s = sid || siteId();
  return mockData.tasks().filter((t) => t.siteId === s);
}

export function updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed') {
  const list = mockData.tasks().map((t) => (t.id === taskId ? { ...t, status } : t));
  mockData.setTasks(list);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Stock Tracking
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getStock(sid?: string): StockItemMock[] {
  return mockData.stock();
}

export function stockInOut(id: string, qty: number, inOrOut: 'in' | 'out') {
  const list = mockData.stock().map((s) => {
    if (s.id !== id) return s;
    const newQty = inOrOut === 'in' ? s.quantity + qty : Math.max(0, s.quantity - qty);
    let status: 'adequate' | 'low' | 'critical' = 'adequate';
    if (newQty <= 0) status = 'critical';
    else if (newQty <= s.reorderLevel) status = 'low';
    return {
      ...s,
      quantity: newQty,
      status,
      lastUpdated: new Date().toISOString(),
      inOut: inOrOut,
      qtyChange: qty,
    };
  });
  mockData.setStock(list);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// GST Bills
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getGSTBills() {
  return mockData.gstBills();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Owner's Dashboard (financial + time)
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getOwnerDashboard(sid?: string) {
  const bills = mockData.gstBills();
  const tasks = mockData.tasks();
  const totalSpend = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.grandTotal, 0);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return {
    totalSpend,
    completedTasks: completed,
    totalTasks: tasks.length,
    progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    recentBills: bills.slice(0, 5),
  };
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Contractor Rating & Management
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getContractors() {
  return mockData.contractors();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Tool Library
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getTools(sid?: string) {
  const s = sid || siteId();
  return mockData.tools().filter((t) => t.siteId === s);
}

export function getToolRequests(sid: string, userId: string): ToolRequestMock[] {
  return mockData.toolRequests().filter((r) => r.siteId === sid && r.userId === userId);
}

export function requestTool(toolId: string, siteId: string, userId: string, requestedDuration: string): ToolRequestMock {
  const tools = mockData.tools();
  const tool = tools.find((t) => t.id === toolId);
  const next: ToolRequestMock = {
    id: `tr-${Date.now()}`,
    toolId,
    toolName: tool?.name ?? 'Tool',
    siteId,
    userId,
    status: 'pending',
    requestedDuration,
    requestedAt: new Date().toISOString(),
  };
  const list = [...mockData.toolRequests(), next];
  mockData.setToolRequests(list);
  triggerRefresh();
  return next;
}

export function returnTool(requestId: string) {
  const list = mockData.toolRequests().map((r) =>
    r.id === requestId ? { ...r, status: 'returned' as const, returnedAt: new Date().toISOString() } : r
  );
  mockData.setToolRequests(list);
  triggerRefresh();
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// OTP Permit-to-Work
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getPermits(sid?: string): PermitOTPMock[] {
  return mockData.permits();
}

export function requestPermit(taskName: string, workerId: string, workerName: string, sid?: string): PermitOTPMock {
  const s = sid || siteId();
  const otp = String(1000 + Math.floor(Math.random() * 9000));
  const next: PermitOTPMock = {
    id: `pt-${Date.now()}`,
    taskName,
    workerId,
    workerName,
    siteId: s,
    status: 'otp_sent',
    requestedAt: new Date().toISOString(),
    otp,
  };
  const list = [...mockData.permits(), next];
  mockData.setPermits(list);
  triggerRefresh();
  return next;
}

export function verifyPermitOTP(id: string, enteredOtp: string): boolean {
  const p = mockData.permits().find((x) => x.id === id);
  if (!p || p.otp !== enteredOtp) return false;
  const list = mockData.permits().map((x) =>
    x.id === id ? { ...x, status: 'verified' as const, verifiedAt: new Date().toISOString() } : x
  );
  mockData.setPermits(list);
  triggerRefresh();
  return true;
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Petty Cash Wallet (geotagged)
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getPettyCash(userId?: string): PettyCashMock[] {
  const list = mockData.pettyCash();
  return userId ? list.filter((p) => p.userId === userId) : list;
}

export function addPettyCash(
  userId: string,
  amount: number,
  purpose: string,
  receiptUri: string | null,
  lat: number,
  lon: number,
  address: string
): PettyCashMock {
  const next: PettyCashMock = {
    id: `pc-${Date.now()}`,
    amount,
    purpose,
    receiptUri,
    lat,
    lon,
    address,
    userId,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  const list = [...mockData.pettyCash(), next];
  mockData.setPettyCash(list);
  triggerRefresh();
  return next;
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Consumption Variance
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

export function getConsumptionVariance(sid?: string) {
  return mockData.consumption();
}

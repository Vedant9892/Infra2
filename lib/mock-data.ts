/**
 * PS02-CFMA Production-Ready Mock Data
 * Realistic data for hackathon demo
 */

export type WorkLog = {
  id: string;
  siteId: string;
  userId: string;
  workDone: string;
  photoUri: string | null;
  lat: number;
  lon: number;
  address: string;
  timestamp: string;
};

export type AttendanceMock = {
  id: string;
  userId: string;
  siteId: string;
  timestamp: string;
  photoUri: string;
  lat: number;
  lon: number;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type MaterialRequestMock = {
  id: string;
  requestedBy: string;
  requestedByRole: string;
  materialName: string;
  quantity: number;
  unit: string;
  rate?: number; // Price per unit (for approval limit calculation)
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  timestamp: string;
  approvedBy?: string;
  rejectionReason?: string;
};

export type TaskMock = {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  assignedByName?: string;
  siteId: string;
  dueDate?: string;
  priority?: string;
};

export type StockItemMock = {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: string;
  reorderLevel: number;
  status: 'adequate' | 'low' | 'critical';
  inOut?: 'in' | 'out';
  qtyChange?: number;
};

export type GSTBillMock = {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorGST: string;
  items: { name: string; quantity: number; rate: number; gst: number }[];
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  date: string;
  status: 'draft' | 'sent' | 'paid';
  projectName?: string;
};

export type ContractorMock = {
  id: string;
  name: string;
  rating: number;
  deadlinesMet: number;
  totalProjects: number;
  defectCount: number;
  paymentAdvice: 'release' | 'hold' | 'partial';
  lastUpdated: string;
};

export type ToolMock = {
  id: string;
  name: string;
  description?: string;
  siteId: string;
  quantity: number;
};

export type ToolRequestMock = {
  id: string;
  toolId: string;
  toolName: string;
  siteId: string;
  userId: string;
  status: 'pending' | 'issued' | 'returned' | 'rejected';
  requestedDuration: string;
  requestedAt: string;
  issuedAt?: string | null;
  returnedAt?: string | null;
};

export type PermitOTPMock = {
  id: string;
  taskName: string;
  workerId: string;
  workerName: string;
  siteId: string;
  status: 'requested' | 'otp_sent' | 'verified' | 'rejected';
  requestedAt: string;
  otp?: string;
  verifiedAt?: string;
};

export type PettyCashMock = {
  id: string;
  amount: number;
  purpose: string;
  receiptUri: string | null;
  lat: number;
  lon: number;
  address: string;
  userId: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type ConsumptionVarianceMock = {
  id: string;
  materialName: string;
  theoreticalQty: number;
  actualQty: number;
  unit: string;
  variance: number;
  variancePercent: number;
  status: 'ok' | 'warning' | 'alert';
  siteId: string;
  updatedAt: string;
};

export type SiteMock = {
  id: string;
  name: string;
  address?: string;
  status: 'active' | 'completed';
  enrollmentCode?: string;
};

export type WorkPhotoMock = { id: string; siteId: string; userId: string; photoUrl: string; timestamp: string; comment?: string };

// Realistic worker names
const WORKERS = ['Ramesh Kumar', 'Suresh Patel', 'Amit Sharma', 'Vikram Singh', 'Rajesh Yadav', 'Mohan Das', 'Kiran Reddy', 'Suresh Nair'];
const ENGINEERS = ['Priya Mehta', 'Arjun Desai', 'Anjali Joshi', 'Rohit Kapoor'];
const SUPERVISORS = ['Mahesh Iyer', 'Deepak Rao', 'Sunita Menon'];

// Generate realistic timestamps
const now = Date.now();
const today = new Date().toISOString();
const yesterday = new Date(now - 86400000).toISOString();
const twoDaysAgo = new Date(now - 172800000).toISOString();
const lastWeek = new Date(now - 604800000).toISOString();

let workLogs: WorkLog[] = [
  { id: 'wl1', siteId: 's1', userId: 'u1', workDone: 'Completed foundation casting for Block A – 120 sqm', photoUri: null, lat: 19.076, lon: 72.8777, address: 'Block A, Andheri West, Mumbai', timestamp: today },
  { id: 'wl2', siteId: 's1', userId: 'u2', workDone: 'Steel reinforcement work – 15 columns completed', photoUri: null, lat: 19.077, lon: 72.878, address: 'Block B, Andheri West', timestamp: yesterday },
  { id: 'wl3', siteId: 's1', userId: 'u3', workDone: 'Plumbing installation – 8 units finished', photoUri: null, lat: 19.075, lon: 72.876, address: 'Block C, Andheri West', timestamp: twoDaysAgo },
  { id: 'wl4', siteId: 's1', userId: 'u1', workDone: 'Electrical wiring – Ground floor completed', photoUri: null, lat: 19.076, lon: 72.8777, address: 'Block A, Andheri West', timestamp: lastWeek },
];

let attendanceMock: AttendanceMock[] = [
  { id: 'a1', userId: 'u1', siteId: 's1', timestamp: today, photoUri: '', lat: 19.076, lon: 72.8777, address: 'Main Gate, Mumbai Residential Complex', status: 'approved' },
  { id: 'a2', userId: 'u2', siteId: 's1', timestamp: today, photoUri: '', lat: 19.077, lon: 72.878, address: 'Block B Entrance, Andheri West', status: 'pending' },
  { id: 'a3', userId: 'u3', siteId: 's1', timestamp: yesterday, photoUri: '', lat: 19.075, lon: 72.876, address: 'Site Office, Andheri West', status: 'approved' },
  { id: 'a4', userId: 'u4', siteId: 's1', timestamp: yesterday, photoUri: '', lat: 19.078, lon: 72.879, address: 'Warehouse Gate, Andheri West', status: 'pending' },
  { id: 'a5', userId: 'u5', siteId: 's1', timestamp: twoDaysAgo, photoUri: '', lat: 19.076, lon: 72.8777, address: 'Main Gate, Mumbai Residential Complex', status: 'approved' },
];

let materialRequests: MaterialRequestMock[] = [
  { id: 'mr1', requestedBy: ENGINEERS[0], requestedByRole: 'junior_engineer', materialName: 'OPC Cement Grade 53', quantity: 250, unit: 'bags', rate: 380, priority: 'high', status: 'pending', reason: 'Urgent: Block A foundation casting scheduled tomorrow', timestamp: today },
  { id: 'mr2', requestedBy: ENGINEERS[1], requestedByRole: 'junior_engineer', materialName: 'TMT Steel Bars 12mm', quantity: 800, unit: 'kg', rate: 65, priority: 'high', status: 'pending', reason: 'Beam reinforcement work in progress', timestamp: today },
  { id: 'mr3', requestedBy: ENGINEERS[2], requestedByRole: 'junior_engineer', materialName: 'River Sand', quantity: 15, unit: 'trucks', rate: 12000, priority: 'medium', status: 'approved', reason: 'Plastering work for Block B', timestamp: yesterday, approvedBy: SUPERVISORS[0] },
  { id: 'mr4', requestedBy: ENGINEERS[3], requestedByRole: 'junior_engineer', materialName: 'Red Bricks', quantity: 5000, unit: 'pieces', rate: 8, priority: 'medium', status: 'approved', reason: 'Masonry work ongoing', timestamp: twoDaysAgo, approvedBy: SUPERVISORS[1] },
  { id: 'mr5', requestedBy: ENGINEERS[0], requestedByRole: 'junior_engineer', materialName: 'White Cement', quantity: 50, unit: 'bags', rate: 450, priority: 'low', status: 'rejected', reason: 'Not required this week', timestamp: lastWeek, rejectionReason: 'Budget constraints' },
  { id: 'mr6', requestedBy: ENGINEERS[1], requestedByRole: 'junior_engineer', materialName: 'Coarse Aggregate 20mm', quantity: 30, unit: 'trucks', rate: 15000, priority: 'high', status: 'pending', reason: 'Concrete mixing for foundation', timestamp: today },
  { id: 'mr7', requestedBy: ENGINEERS[2], requestedByRole: 'junior_engineer', materialName: 'Reinforcement Mesh', quantity: 200, unit: 'sqm', rate: 180, priority: 'medium', status: 'pending', reason: 'Slab reinforcement', timestamp: today },
];

let tasksMock: TaskMock[] = [
  { id: 't1', title: 'Foundation Inspection & Quality Check', description: 'Inspect Block A foundation before casting', status: 'pending', siteId: 's1', assignedTo: 'u1', assignedByName: SUPERVISORS[0], dueDate: today, priority: 'high' },
  { id: 't2', title: 'Steel Framework Installation', description: 'Complete steel framework for Block B – 2nd floor', status: 'in_progress', siteId: 's1', assignedTo: 'u2', assignedByName: SUPERVISORS[0], dueDate: today, priority: 'high' },
  { id: 't3', title: 'Material Stock Verification', description: 'Verify incoming cement and steel stock', status: 'completed', siteId: 's1', assignedTo: 'u3', assignedByName: SUPERVISORS[1], dueDate: yesterday, priority: 'medium' },
  { id: 't4', title: 'Plumbing Installation – Block C', description: 'Complete plumbing for 12 units in Block C', status: 'in_progress', siteId: 's1', assignedTo: 'u4', assignedByName: SUPERVISORS[0], dueDate: today, priority: 'medium' },
  { id: 't5', title: 'Electrical Wiring – Ground Floor', description: 'Install electrical wiring for ground floor units', status: 'pending', siteId: 's1', assignedTo: 'u5', assignedByName: SUPERVISORS[1], dueDate: today, priority: 'high' },
  { id: 't6', title: 'Safety Equipment Check', description: 'Inspect and replace damaged safety equipment', status: 'completed', siteId: 's1', assignedTo: 'u1', assignedByName: SUPERVISORS[0], dueDate: yesterday, priority: 'high' },
];

let stockMock: StockItemMock[] = [
  { id: 'st1', materialName: 'OPC Cement Grade 53', quantity: 1250, unit: 'bags', location: 'Warehouse A', lastUpdated: today, reorderLevel: 500, status: 'adequate' },
  { id: 'st2', materialName: 'TMT Steel Bars 12mm', quantity: 3200, unit: 'kg', location: 'Steel Yard', lastUpdated: today, reorderLevel: 1500, status: 'adequate' },
  { id: 'st3', materialName: 'River Sand', quantity: 28, unit: 'trucks', location: 'Stockpile Area', lastUpdated: yesterday, reorderLevel: 20, status: 'low' },
  { id: 'st4', materialName: 'White Cement', quantity: 12, unit: 'bags', location: 'Store Room', lastUpdated: twoDaysAgo, reorderLevel: 30, status: 'critical' },
  { id: 'st5', materialName: 'Red Bricks', quantity: 8500, unit: 'pieces', location: 'Brick Stack', lastUpdated: today, reorderLevel: 5000, status: 'adequate' },
  { id: 'st6', materialName: 'PVC Pipes 4 inch', quantity: 45, unit: 'pieces', location: 'Plumbing Store', lastUpdated: yesterday, reorderLevel: 30, status: 'low' },
  { id: 'st7', materialName: 'Electrical Wires 2.5mm', quantity: 8, unit: 'rolls', location: 'Electrical Store', lastUpdated: twoDaysAgo, reorderLevel: 15, status: 'critical' },
];

let gstBillsMock: GSTBillMock[] = [
  {
    id: 'g1',
    billNumber: 'INV-2024-001',
    vendorName: 'ABC Cement Industries Ltd',
    vendorGST: '27AABCU9603R1ZM',
    items: [{ name: 'OPC Cement Grade 53', quantity: 500, rate: 420, gst: 18 }],
    totalAmount: 210000,
    gstAmount: 37800,
    grandTotal: 247800,
    date: today,
    status: 'sent',
    projectName: 'Mumbai Residential Complex',
  },
  {
    id: 'g2',
    billNumber: 'INV-2024-002',
    vendorName: 'Steel Corporation of India',
    vendorGST: '29AABCS1234F1Z5',
    items: [{ name: 'TMT Bars 12mm', quantity: 2000, rate: 68, gst: 18 }],
    totalAmount: 136000,
    gstAmount: 24480,
    grandTotal: 160480,
    date: yesterday,
    status: 'paid',
    projectName: 'Mumbai Residential Complex',
  },
  {
    id: 'g3',
    billNumber: 'INV-2024-003',
    vendorName: 'Sand Suppliers Pvt Ltd',
    vendorGST: '19AABCS5678G2H6',
    items: [{ name: 'River Sand', quantity: 20, rate: 8500, gst: 5 }],
    totalAmount: 170000,
    gstAmount: 8500,
    grandTotal: 178500,
    date: twoDaysAgo,
    status: 'paid',
    projectName: 'Mumbai Residential Complex',
  },
  {
    id: 'g4',
    billNumber: 'INV-2024-004',
    vendorName: 'Brick Manufacturers Association',
    vendorGST: '24AABCS9012I3J7',
    items: [{ name: 'Red Bricks', quantity: 10000, rate: 8, gst: 12 }],
    totalAmount: 80000,
    gstAmount: 9600,
    grandTotal: 89600,
    date: lastWeek,
    status: 'draft',
    projectName: 'Mumbai Residential Complex',
  },
];

let contractorsMock: ContractorMock[] = [
  { id: 'c1', name: 'Sharma Builders & Associates', rating: 8.7, deadlinesMet: 18, totalProjects: 22, defectCount: 3, paymentAdvice: 'release', lastUpdated: today },
  { id: 'c2', name: 'Patel Construction Co', rating: 6.4, deadlinesMet: 8, totalProjects: 12, defectCount: 7, paymentAdvice: 'hold', lastUpdated: yesterday },
  { id: 'c3', name: 'Kumar Contractors Pvt Ltd', rating: 9.2, deadlinesMet: 25, totalProjects: 25, defectCount: 1, paymentAdvice: 'release', lastUpdated: today },
  { id: 'c4', name: 'Reddy Infrastructure', rating: 7.8, deadlinesMet: 14, totalProjects: 18, defectCount: 4, paymentAdvice: 'partial', lastUpdated: twoDaysAgo },
  { id: 'c5', name: 'Iyer Engineering Works', rating: 5.9, deadlinesMet: 4, totalProjects: 9, defectCount: 8, paymentAdvice: 'hold', lastUpdated: lastWeek },
];

let toolsMock: ToolMock[] = [
  { id: 'tl1', name: 'Heavy Duty Hammer', description: '5kg claw hammer for demolition', siteId: 's1', quantity: 15 },
  { id: 'tl2', name: 'Power Drill Set', description: 'Cordless drill with multiple bits', siteId: 's1', quantity: 8 },
  { id: 'tl3', name: 'Angle Grinder', description: '4.5 inch cutting and grinding', siteId: 's1', quantity: 6 },
  { id: 'tl4', name: 'Welding Machine', description: 'Arc welding 200A capacity', siteId: 's1', quantity: 3 },
  { id: 'tl5', name: 'Measuring Tape', description: '30m steel measuring tape', siteId: 's1', quantity: 20 },
  { id: 'tl6', name: 'Spirit Level', description: '1.5m aluminum spirit level', siteId: 's1', quantity: 12 },
];

let toolRequestsMock: ToolRequestMock[] = [
  { id: 'tr1', toolId: 'tl1', toolName: 'Heavy Duty Hammer', siteId: 's1', userId: 'u1', status: 'issued', requestedDuration: '2h', requestedAt: today, issuedAt: today },
  { id: 'tr2', toolId: 'tl2', toolName: 'Power Drill Set', siteId: 's1', userId: 'u2', status: 'pending', requestedDuration: '4h', requestedAt: today },
  { id: 'tr3', toolId: 'tl3', toolName: 'Angle Grinder', siteId: 's1', userId: 'u3', status: 'returned', requestedDuration: '1h', requestedAt: yesterday, issuedAt: yesterday, returnedAt: today },
];

let permitsMock: PermitOTPMock[] = [
  { id: 'pt1', taskName: 'Electrical Trenching – High Voltage', workerId: 'u1', workerName: WORKERS[0], siteId: 's1', status: 'otp_sent', requestedAt: today, otp: '8421' },
  { id: 'pt2', taskName: 'Welding Work – Roof Structure', workerId: 'u2', workerName: WORKERS[1], siteId: 's1', status: 'requested', requestedAt: today },
  { id: 'pt3', taskName: 'Crane Operation – Heavy Lifting', workerId: 'u3', workerName: WORKERS[2], siteId: 's1', status: 'verified', requestedAt: yesterday, otp: '5678', verifiedAt: yesterday },
];

let pettyCashMock: PettyCashMock[] = [
  { id: 'pc1', amount: 3500, purpose: 'Site refreshments & snacks for 25 workers', receiptUri: null, lat: 19.076, lon: 72.8777, address: 'Andheri West, Mumbai', userId: 'u1', timestamp: today, status: 'pending' },
  { id: 'pc2', amount: 2200, purpose: 'Minor tool repairs – drill bits replacement', receiptUri: null, lat: 19.078, lon: 72.879, address: 'Site Store, Andheri West', userId: 'u1', timestamp: yesterday, status: 'approved' },
  { id: 'pc3', amount: 1800, purpose: 'Safety equipment – gloves and helmets', receiptUri: null, lat: 19.075, lon: 72.876, address: 'Safety Store, Andheri', userId: 'u2', timestamp: twoDaysAgo, status: 'approved' },
  { id: 'pc4', amount: 4500, purpose: 'Emergency plumbing supplies', receiptUri: null, lat: 19.077, lon: 72.878, address: 'Hardware Store, Andheri West', userId: 'u3', timestamp: today, status: 'pending' },
];

let consumptionMock: ConsumptionVarianceMock[] = [
  { id: 'cv1', materialName: 'OPC Cement', theoreticalQty: 500, actualQty: 495, unit: 'bags', variance: -5, variancePercent: -1, status: 'ok', siteId: 's1', updatedAt: today },
  { id: 'cv2', materialName: 'TMT Steel Bars', theoreticalQty: 2000, actualQty: 2150, unit: 'kg', variance: 150, variancePercent: 7.5, status: 'warning', siteId: 's1', updatedAt: today },
  { id: 'cv3', materialName: 'River Sand', theoreticalQty: 15, actualQty: 22, unit: 'trucks', variance: 7, variancePercent: 46.7, status: 'alert', siteId: 's1', updatedAt: yesterday },
  { id: 'cv4', materialName: 'Red Bricks', theoreticalQty: 8000, actualQty: 7850, unit: 'pieces', variance: -150, variancePercent: -1.9, status: 'ok', siteId: 's1', updatedAt: today },
];

const defaultSiteId = 's1';

let sitesMock: SiteMock[] = [
  { id: 's1', name: 'Mumbai Residential Complex', address: 'Andheri West, Mumbai, Maharashtra 400053', status: 'active', enrollmentCode: 'SITE-A1' },
  { id: 's2', name: 'Pune Industrial Block', address: 'Hinjewadi Phase 2, Pune, Maharashtra 411057', status: 'active', enrollmentCode: 'SITE-B2' },
  { id: 's3', name: 'Thane Commercial Plaza', address: 'Kolshet Road, Thane, Maharashtra 400607', status: 'active', enrollmentCode: 'SITE-C3' },
];

let labourSitesMap: Record<string, string[]> = { u1: ['s1'], u2: ['s1', 's2'], default: ['s1'] };

let workPhotosMock: WorkPhotoMock[] = [
  { id: 'wp1', siteId: 's1', userId: 'u1', photoUrl: '', timestamp: today },
  { id: 'wp2', siteId: 's1', userId: 'u2', photoUrl: '', timestamp: yesterday },
  { id: 'wp3', siteId: 's1', userId: 'u3', photoUrl: '', timestamp: twoDaysAgo },
];

export const mockData = {
  sites: () => sitesMock,
  setSites: (v: SiteMock[]) => { sitesMock = v; },
  labourSitesMap: () => labourSitesMap,
  setLabourSitesMap: (v: Record<string, string[]>) => { labourSitesMap = v; },
  workPhotos: () => workPhotosMock,
  setWorkPhotos: (v: WorkPhotoMock[]) => { workPhotosMock = v; },
  workLogs: () => workLogs,
  setWorkLogs: (v: WorkLog[]) => { workLogs = v; },
  attendance: () => attendanceMock,
  setAttendance: (v: AttendanceMock[]) => { attendanceMock = v; },
  materialRequests: () => materialRequests,
  setMaterialRequests: (v: MaterialRequestMock[]) => { materialRequests = v; },
  tasks: () => tasksMock,
  setTasks: (v: TaskMock[]) => { tasksMock = v; },
  stock: () => stockMock,
  setStock: (v: StockItemMock[]) => { stockMock = v; },
  gstBills: () => gstBillsMock,
  setGstBills: (v: GSTBillMock[]) => { gstBillsMock = v; },
  contractors: () => contractorsMock,
  setContractors: (v: ContractorMock[]) => { contractorsMock = v; },
  tools: () => toolsMock,
  setTools: (v: ToolMock[]) => { toolsMock = v; },
  toolRequests: () => toolRequestsMock,
  setToolRequests: (v: ToolRequestMock[]) => { toolRequestsMock = v; },
  permits: () => permitsMock,
  setPermits: (v: PermitOTPMock[]) => { permitsMock = v; },
  pettyCash: () => pettyCashMock,
  setPettyCash: (v: PettyCashMock[]) => { pettyCashMock = v; },
  consumptionVariance: () => consumptionMock,
  setConsumptionVariance: (v: ConsumptionVarianceMock[]) => { consumptionMock = v; },
  defaultSiteId: () => defaultSiteId,
};

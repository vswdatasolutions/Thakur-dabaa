// --- User & Auth ---

export enum UserRole {
  Owner = 'Owner',
  Admin = 'Admin',
  Manager = 'Manager',
  SalesManCashier = 'Sales Man / Cashier',
  GeneralStaff = 'General Staff',
  CA = 'CA (Accountant)',
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User) => void;
  logout: () => void;
  initializeAuth: () => void;
}

// --- Hotel Management ---

export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Cleaning = 'Cleaning',
  Maintenance = 'Maintenance',
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  status: RoomStatus;
  capacity: number;
  description?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  kycDocumentUrl?: string; // URL to uploaded KYC document
}

export enum BookingStatus {
  Confirmed = 'Confirmed',
  Pending = 'Pending',
  CheckedIn = 'Checked-In',
  CheckedOut = 'Checked-Out',
  Cancelled = 'Cancelled',
}

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  totalAmount: number;
  advancePayment: number;
  notes?: string;
  room?: Room; // Optional: can be populated when fetching bookings with room details
  guest?: Guest; // Optional: can be populated when fetching bookings with guest details
}

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'Room' | 'Food & Beverage' | 'Service' | 'Other';
}

export interface Bill {
  id: string;
  bookingId?: string; // Optional: A bill might be standalone, or linked to a booking
  guestId?: string; // Optional: A bill might be for a walk-in, or linked to a guest
  roomNumber?: string; // Optional: If linked to a room
  items: BillItem[];
  subtotal: number;
  gstAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partially Paid';
  billDate: string;
  invoiceNumber: string;
}

// --- Bar POS & Liquor Management ---

export enum MenuItemCategory {
  Whiskey = 'Whiskey',
  Rum = 'Rum',
  Beer = 'Beer',
  Wine = 'Wine',
  Cocktails = 'Cocktails',
  SoftDrinks = 'Soft Drinks',
  Snacks = 'Snacks',
}

export interface BarMenuItem {
  id: string;
  name: string;
  category: MenuItemCategory;
  price: number;
  // For liquor items, might track available quantity (e.g., in ml) or bottle count
  // For simplicity, we'll assume inventory is handled separately for liquor bottles
  // and menu items are sold by peg/glass.
  unit?: string; // e.g., 'peg', 'glass', 'bottle', 'can'
  stockQuantity: number; // Current stock for this specific menu item unit
  bottleId?: string; // If this item comes from a specific bottle in inventory
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface BarOrder {
  id: string;
  tableNumber: string; // Or room number for hotel guests
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending';
  orderDate: string;
  isKOTPrinted: boolean;
}

export interface LiquorBottle {
  id: string;
  name: string;
  brand: string;
  totalVolumeMl: number; // e.g., 750ml, 1000ml
  currentVolumeMl: number; // Remaining volume
  pricePerBottle: number;
  pegSizeMl: number; // e.g., 30ml, 60ml
  category: MenuItemCategory; // e.g., Whiskey, Rum
  purchaseDate: string;
  expiryDate?: string;
  supplierId: string;
  batchNumber: string;
  wastageMl: number; // Tracked wastage for this specific bottle
  lowStockThresholdMl: number; // Alert if currentVolumeMl falls below this
}

// --- Inventory Management System ---

export enum InventoryItemCategory {
  Food = 'Food',
  Beverage = 'Beverage',
  Cleaning = 'Cleaning Supplies',
  Linen = 'Linen',
  Maintenance = 'Maintenance',
  Office = 'Office Supplies',
  Liquor = 'Liquor', // For liquor bottles, managed more specifically
  Other = 'Other',
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  unit: string; // e.g., 'kg', 'liter', 'piece', 'bottle'
  currentStock: number;
  minStockLevel: number; // Low stock alert if currentStock < minStockLevel
  expiryDate?: string;
  lastPurchaseDate?: string;
  lastConsumptionDate?: string;
  supplierId?: string;
  purchasePrice: number;
}

export enum TransactionType {
  StockIn = 'Stock-In',
  StockOut = 'Stock-Out',
  Adjustment = 'Adjustment',
  Wastage = 'Wastage',
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  transactionType: TransactionType;
  quantity: number;
  date: string;
  notes?: string;
  relatedOrderId?: string; // For purchases or sales
  processedByUserId: string;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: { itemId: string; quantity: number; unitPrice: number; }[];
  totalAmount: number;
  status: 'Pending' | 'Ordered' | 'Received' | 'Cancelled';
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
}

// --- Reports & Analytics ---

export interface SalesReportEntry {
  date: string;
  hotelRevenue: number;
  barRevenue: number;
  totalRevenue: number;
  gstCollected: number;
  discountsGiven: number;
}

export interface InventoryReportEntry {
  itemId: string;
  itemName: string;
  category: InventoryItemCategory;
  unit: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  wastage: number;
  closingStock: number;
}

export interface StaffReportEntry {
  staffId: string;
  staffName: string;
  role: UserRole;
  hoursWorked: number;
  tasksCompleted: number;
  salesGenerated?: number; // For sales staff
}

export interface GSTReportEntry {
  date: string;
  invoiceNumber: string;
  customerName: string;
  gstType: 'CGST' | 'SGST' | 'IGST';
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
}

// --- Theme ---
export type Theme = 'light' | 'dark';

// --- Multi-language (Placeholder) ---
export type Language = 'en' | 'kn'; // English, Kannada

// --- Modals ---
export enum ModalType {
  None,
  AddEditRoom,
  RoomDetails,
  NewBooking,
  EditBooking,
  AddInventoryItem,
  EditInventoryItem,
  AddLiquorBottle,
  EditLiquorBottle,
  AddPurchaseOrder,
  EditPurchaseOrder,
  AddVendor,
  EditVendor,
  AddEditUser,
  ConfirmAction,
  BarOrderDetails,
  SplitBill,
  AIReportAssistant,
  AddEditBill, // New: for adding/editing bills
  BillDetails, // New: for viewing bill details
}

export interface ConfirmActionModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

// --- Recharts Data ---
export interface ChartDataPoint {
  name: string;
  value: number;
}
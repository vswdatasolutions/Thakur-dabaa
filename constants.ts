import { UserRole, MenuItemCategory, InventoryItemCategory, RoomStatus, BookingStatus, GSTReportEntry, Bill, BillItem } from './types';

// --- API Key (Assumed to be set by environment) ---
export const GEMINI_API_KEY = process.env.API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

// --- User Roles and Permissions (Conceptual) ---
// In a real app, these would be managed more dynamically, but this provides a baseline.
export const ROLE_PERMISSIONS = {
  [UserRole.Owner]: {
    canManageRooms: true,
    canManageBookings: true,
    canManageBarPOS: true,
    canManageLiquorInventory: true,
    canManageInventory: true,
    canViewAllReports: true,
    canManageUsersRoles: true,
    canManageVendors: true,
    canManageSettings: true,
    canAccessStaffPanel: true,
    canAccessGSTAccounts: true,
    canManageBilling: true, // New permission for billing
  },
  [UserRole.Admin]: {
    canManageRooms: true,
    canManageBookings: true,
    canManageBarPOS: true,
    canManageLiquorInventory: true,
    canManageInventory: true,
    canViewAllReports: true,
    canManageUsersRoles: true,
    canManageVendors: true,
    canManageSettings: true,
    canAccessStaffPanel: true,
    canAccessGSTAccounts: true,
    canManageBilling: true, // New permission for billing
  },
  [UserRole.Manager]: {
    canManageRooms: true,
    canManageBookings: true,
    canManageBarPOS: true,
    canManageLiquorInventory: true,
    canManageInventory: true,
    canViewAllReports: true,
    canManageUsersRoles: false, // Managers cannot manage users/roles
    canManageVendors: true,
    canManageSettings: false,
    canAccessStaffPanel: true,
    canAccessGSTAccounts: true, // Can view and approve relevant reports
    canManageBilling: true, // New permission for billing
  },
  [UserRole.SalesManCashier]: {
    canManageRooms: false,
    canManageBookings: true, // Can check-in/out, generate bills
    canManageBarPOS: true,
    canManageLiquorInventory: false,
    canManageInventory: false,
    canViewAllReports: false,
    canManageUsersRoles: false,
    canManageVendors: false,
    canManageSettings: false,
    canAccessStaffPanel: true,
    canAccessGSTAccounts: false,
    canManageBilling: true, // New permission for billing
  },
  [UserRole.GeneralStaff]: {
    canManageRooms: true, // Can update room status (cleaning, maintenance)
    canManageBookings: false,
    canManageBarPOS: false,
    canManageLiquorInventory: false,
    canManageInventory: false,
    canViewAllReports: false,
    canManageUsersRoles: false,
    canManageVendors: false,
    canManageSettings: false,
    canAccessStaffPanel: true,
    canAccessGSTAccounts: false,
    canManageBilling: false, // General staff cannot manage billing
  },
  [UserRole.CA]: { // Chartered Accountant
    canManageRooms: false,
    canManageBookings: false,
    canManageBarPOS: false,
    canManageLiquorInventory: false,
    canManageInventory: false,
    canViewAllReports: true, // Access to financial reports
    canManageUsersRoles: false,
    canManageVendors: false,
    canManageSettings: false,
    canAccessStaffPanel: false,
    canAccessGSTAccounts: true, // Specific GST, Accounts, Ledger access
    canManageBilling: true, // CA can manage/view billing for accounting
  },
};


// --- Navigation Paths ---
export const NAV_ITEMS = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard', roles: Object.values(UserRole) },
  { path: '/rooms', icon: '🏨', label: 'Rooms', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.GeneralStaff] },
  { path: '/booking', icon: '📝', label: 'Bookings', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier] },
  { path: '/bar-pos', icon: '🍻', label: 'Bar POS', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier] },
  { path: '/inventory', icon: '📦', label: 'Inventory', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager] },
  { path: '/vendors', icon: '🚚', label: 'Vendors', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager] },
  { path: '/billing', icon: '💰', label: 'Billing', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.SalesManCashier, UserRole.CA] }, // New
  { path: '/reports', icon: '📊', label: 'Reports', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.CA] },
  { path: '/users', icon: '👥', label: 'Users & Roles', roles: [UserRole.Owner, UserRole.Admin] },
  { path: '/staff-panel', icon: '👷', label: 'Staff Panel', roles: [UserRole.Owner, UserRole.Admin, UserRole.Manager, UserRole.GeneralStaff] },
  { path: '/settings', icon: '⚙️', label: 'Settings', roles: [UserRole.Owner, UserRole.Admin] },
];

// --- Mock Data Constants (for initial load and simulation) ---

export const MOCK_USERS = [
  { id: 'usr-001', username: 'owner', email: 'owner@example.com', role: UserRole.Owner, token: 'fake-owner-token' },
  { id: 'usr-002', username: 'admin', email: 'admin@example.com', role: UserRole.Admin, token: 'fake-admin-token' },
  { id: 'usr-003', username: 'manager', email: 'manager@example.com', role: UserRole.Manager, token: 'fake-manager-token' },
  { id: 'usr-004', username: 'cashier', email: 'cashier@example.com', role: UserRole.SalesManCashier, token: 'fake-cashier-token' },
  { id: 'usr-005', username: 'staff', email: 'staff@example.com', role: UserRole.GeneralStaff, token: 'fake-staff-token' },
  { id: 'usr-006', username: 'ca', email: 'ca@example.com', role: UserRole.CA, token: 'fake-ca-token' },
];

export const MOCK_ROOMS = [
  { id: 'room-101', roomNumber: '101', roomType: 'Standard', price: 1500, status: RoomStatus.Occupied, capacity: 2, description: 'Cozy standard room.' },
  { id: 'room-102', roomNumber: '102', roomType: 'Standard', price: 1500, status: RoomStatus.Vacant, capacity: 2, description: 'Cozy standard room.' },
  { id: 'room-103', roomNumber: '103', roomType: 'Deluxe', price: 2500, status: RoomStatus.Cleaning, capacity: 3, description: 'Spacious deluxe room with a view.' },
  // Fix: Added missing 'roomNumber' property to match the 'Room' interface
  { id: 'room-104', roomNumber: '104', roomType: 'Suite', price: 4000, status: RoomStatus.Vacant, capacity: 4, description: 'Luxury suite with living area.' },
  { id: 'room-105', roomNumber: '105', roomType: 'Standard', price: 1500, status: RoomStatus.Vacant, capacity: 2, description: 'Cozy standard room.' },
  { id: 'room-106', roomNumber: '106', roomType: 'Deluxe', price: 2500, status: RoomStatus.Occupied, capacity: 3, description: 'Spacious deluxe room with a view.' },
  { id: 'room-107', roomNumber: '107', roomType: 'Standard', price: 1500, status: RoomStatus.Maintenance, capacity: 2, description: 'Under repair.' },
  { id: 'room-108', roomNumber: '108', roomType: 'Suite', price: 4000, status: RoomStatus.Vacant, capacity: 4, description: 'Luxury suite with living area.' },
  { id: 'room-201', roomNumber: '201', roomType: 'Deluxe', price: 2500, status: RoomStatus.Vacant, capacity: 3, description: 'Spacious deluxe room with a view.' },
  { id: 'room-202', roomNumber: '202', roomType: 'Standard', price: 1500, status: RoomStatus.Occupied, capacity: 2, description: 'Cozy standard room.' },
];

export const MOCK_GUESTS = [
  { id: 'gst-001', name: 'Alice Smith', email: 'alice@example.com', phone: '123-456-7890', address: '123 Main St', kycDocumentUrl: 'https://picsum.photos/300/200?random=1' },
  { id: 'gst-002', name: 'Bob Johnson', email: 'bob@example.com', phone: '098-765-4321', address: '456 Oak Ave', kycDocumentUrl: 'https://picsum.photos/300/200?random=2' },
];

export const MOCK_BOOKINGS = [
  { id: 'bkg-001', roomId: 'room-101', guestId: 'gst-001', checkInDate: '2024-07-20', checkOutDate: '2024-07-25', status: BookingStatus.CheckedIn, totalAmount: 7500, advancePayment: 1500, notes: 'Early check-in requested.' },
  { id: 'bkg-002', roomId: 'room-106', guestId: 'gst-002', checkInDate: '2024-07-22', checkOutDate: '2024-07-27', status: BookingStatus.Confirmed, totalAmount: 12500, advancePayment: 2500, notes: 'Late checkout requested.' },
  { id: 'bkg-003', roomId: 'room-102', guestId: 'gst-001', checkInDate: '2024-07-28', checkOutDate: '2024-07-30', status: BookingStatus.Pending, totalAmount: 3000, advancePayment: 0, notes: 'Follow up for payment.' },
];

export const MOCK_BAR_MENU_ITEMS = [
  { id: 'bmi-001', name: 'Whiskey Sour', category: MenuItemCategory.Cocktails, price: 550, unit: 'glass', stockQuantity: 50 },
  { id: 'bmi-002', name: 'Old Monk (30ml)', category: MenuItemCategory.Rum, price: 200, unit: 'peg', stockQuantity: 100, bottleId: 'liq-002' },
  { id: 'bmi-003', name: 'Kingfisher Beer', category: MenuItemCategory.Beer, price: 300, unit: 'bottle', stockQuantity: 40 },
  { id: 'bmi-004', name: 'Vodka Martini', category: MenuItemCategory.Cocktails, price: 600, unit: 'glass', stockQuantity: 30 },
  { id: 'bmi-005', name: 'Glenfiddich 12 (60ml)', category: MenuItemCategory.Whiskey, price: 1200, unit: 'peg', stockQuantity: 20, bottleId: 'liq-001' },
  { id: 'bmi-006', name: 'Coca Cola', category: MenuItemCategory.SoftDrinks, price: 100, unit: 'can', stockQuantity: 60 },
  { id: 'bmi-007', name: 'Masala Peanuts', category: MenuItemCategory.Snacks, price: 150, unit: 'plate', stockQuantity: 25 },
];

export const MOCK_LIQUOR_BOTTLES = [
  { id: 'liq-001', name: 'Glenfiddich 12 Year Old', brand: 'Glenfiddich', totalVolumeMl: 750, currentVolumeMl: 450, pricePerBottle: 8000, pegSizeMl: 30, category: MenuItemCategory.Whiskey, purchaseDate: '2024-06-01', expiryDate: '2030-06-01', supplierId: 'vnd-001', batchNumber: 'GF12-B001', wastageMl: 10, lowStockThresholdMl: 100 },
  { id: 'liq-002', name: 'Old Monk Rum', brand: 'Old Monk', totalVolumeMl: 1000, currentVolumeMl: 800, pricePerBottle: 1200, pegSizeMl: 30, category: MenuItemCategory.Rum, purchaseDate: '2024-07-01', expiryDate: '2028-07-01', supplierId: 'vnd-002', batchNumber: 'OM-R001', wastageMl: 0, lowStockThresholdMl: 200 },
  { id: 'liq-003', name: 'Sula Red Wine', brand: 'Sula', totalVolumeMl: 750, currentVolumeMl: 750, pricePerBottle: 900, pegSizeMl: 150, category: MenuItemCategory.Wine, purchaseDate: '2024-07-10', expiryDate: '2026-07-10', supplierId: 'vnd-001', batchNumber: 'SULA-W001', wastageMl: 0, lowStockThresholdMl: 150 },
];

export const MOCK_INVENTORY_ITEMS = [
  { id: 'inv-001', name: 'Fresh Chicken', category: InventoryItemCategory.Food, unit: 'kg', currentStock: 25, minStockLevel: 10, expiryDate: '2024-07-25', lastPurchaseDate: '2024-07-20', purchasePrice: 250 },
  { id: 'inv-002', name: 'Dish Soap', category: InventoryItemCategory.Cleaning, unit: 'liter', currentStock: 5, minStockLevel: 2, lastPurchaseDate: '2024-07-15', purchasePrice: 150 },
  { id: 'inv-003', name: 'Bed Sheets (King)', category: InventoryItemCategory.Linen, unit: 'piece', currentStock: 30, minStockLevel: 15, lastPurchaseDate: '2024-06-01', purchasePrice: 500 },
  { id: 'inv-004', name: 'Printer Paper', category: InventoryItemCategory.Office, unit: 'ream', currentStock: 10, minStockLevel: 5, lastPurchaseDate: '2024-07-05', purchasePrice: 300 },
  { id: 'inv-005', name: 'Coca Cola Can', category: InventoryItemCategory.Beverage, unit: 'can', currentStock: 120, minStockLevel: 50, expiryDate: '2025-01-01', lastPurchaseDate: '2024-07-18', purchasePrice: 35 },
];

export const MOCK_VENDORS = [
  { id: 'vnd-001', name: 'Premium Beverage Co.', contactPerson: 'John Doe', phone: '987-654-3210', email: 'john@premium.com', address: '789 Liquor St', gstNumber: '29ABCDE1234F1Z5' },
  { id: 'vnd-002', name: 'Fresh Foods Inc.', contactPerson: 'Jane Smith', phone: '111-222-3333', email: 'jane@fresh.com', address: '101 Farm Rd', gstNumber: '29FGHIJ5678K1Z2' },
];

export const MOCK_REPORTS = {
  sales: [
    { date: '2024-07-01', hotelRevenue: 5000, barRevenue: 2500, totalRevenue: 7500, gstCollected: 750, discountsGiven: 100 },
    { date: '2024-07-02', hotelRevenue: 6000, barRevenue: 3000, totalRevenue: 9000, gstCollected: 900, discountsGiven: 150 },
    { date: '2024-07-03', hotelRevenue: 5500, barRevenue: 2800, totalRevenue: 8300, gstCollected: 830, discountsGiven: 80 },
    { date: '2024-07-20', hotelRevenue: 7000, barRevenue: 3500, totalRevenue: 10500, gstCollected: 1050, discountsGiven: 200 },
    { date: '2024-07-21', hotelRevenue: 7200, barRevenue: 3800, totalRevenue: 11000, gstCollected: 1100, discountsGiven: 220 },
    { date: '2024-07-22', hotelRevenue: 8000, barRevenue: 4000, totalRevenue: 12000, gstCollected: 1200, discountsGiven: 250 },
  ],
  inventory: [
    { itemId: 'inv-001', itemName: 'Fresh Chicken', category: InventoryItemCategory.Food, unit: 'kg', openingStock: 30, stockIn: 10, stockOut: 15, wastage: 0, closingStock: 25 },
    { itemId: 'liq-001', itemName: 'Glenfiddich 12 Year Old', category: InventoryItemCategory.Liquor, unit: 'bottle', openingStock: 1, stockIn: 0, stockOut: 0, wastage: 0.01, closingStock: 0.6 }, // Representing current volume in bottles
    { itemId: 'inv-002', itemName: 'Dish Soap', category: InventoryItemCategory.Cleaning, unit: 'liter', openingStock: 6, stockIn: 0, stockOut: 1, wastage: 0, closingStock: 5 },
  ],
  staff: [
    { staffId: 'usr-004', staffName: 'cashier', role: UserRole.SalesManCashier, hoursWorked: 8, tasksCompleted: 15, salesGenerated: 5000 },
    { staffId: 'usr-005', staffName: 'staff', role: UserRole.GeneralStaff, hoursWorked: 8, tasksCompleted: 10 },
  ],
  gst: [
    // Fix: Explicitly typed 'gstType' to match 'GSTReportEntry['gstType']'
    { date: '2024-07-20', invoiceNumber: 'INV-H001', customerName: 'Alice Smith', gstType: 'CGST' as GSTReportEntry['gstType'], gstRate: 9, taxableAmount: 6000, gstAmount: 540 },
    { date: '2024-07-20', invoiceNumber: 'INV-H001', customerName: 'Alice Smith', gstType: 'SGST' as GSTReportEntry['gstType'], gstRate: 9, taxableAmount: 6000, gstAmount: 540 },
    { date: '2024-07-21', invoiceNumber: 'INV-B002', customerName: 'Walk-in', gstType: 'CGST' as GSTReportEntry['gstType'], gstRate: 9, taxableAmount: 3000, gstAmount: 270 },
    { date: '2024-07-21', invoiceNumber: 'INV-B002', customerName: 'Walk-in', gstType: 'SGST' as GSTReportEntry['gstType'], gstRate: 9, taxableAmount: 3000, gstAmount: 270 },
  ],
};

// Mock Bills for initial data
// Fix: Explicitly typed MOCK_BILLS as Bill[] to enforce type safety from the start.
export const MOCK_BILLS: Bill[] = [
  {
    id: 'bill-001',
    bookingId: 'bkg-001',
    guestId: 'gst-001',
    roomNumber: '101',
    items: [
      { id: 'bi-001-1', description: 'Room 101 (2024-07-20 to 2024-07-25)', quantity: 5, unitPrice: 1500, total: 7500, category: 'Room' },
      { id: 'bi-001-2', description: 'Dinner (F&B)', quantity: 1, unitPrice: 1200, total: 1200, category: 'Food & Beverage' },
    ],
    subtotal: 8700,
    gstAmount: 1566, // 18% of 8700
    discount: 100,
    totalAmount: 10166,
    paymentStatus: 'Paid',
    billDate: '2024-07-25',
    invoiceNumber: 'INV-H-001',
  },
  {
    id: 'bill-002',
    bookingId: 'bkg-002',
    guestId: 'gst-002',
    roomNumber: '106',
    items: [
      { id: 'bi-002-1', description: 'Room 106 (2024-07-22 to 2024-07-27)', quantity: 5, unitPrice: 2500, total: 12500, category: 'Room' },
      { id: 'bi-002-2', description: 'Mini Bar Consumption', quantity: 1, unitPrice: 350, total: 350, category: 'Food & Beverage' },
    ],
    subtotal: 12850,
    gstAmount: 2313, // 18% of 12850
    discount: 0,
    totalAmount: 15163,
    paymentStatus: 'Pending',
    billDate: '2024-07-27',
    invoiceNumber: 'INV-H-002',
  },
  {
    id: 'bill-003',
    bookingId: undefined, // Example of a standalone bill
    guestId: undefined,
    roomNumber: undefined,
    items: [
      { id: 'bi-003-1', description: 'Bar Order (Walk-in)', quantity: 1, unitPrice: 1500, total: 1500, category: 'Food & Beverage' },
    ],
    subtotal: 1500,
    gstAmount: 270, // 18% of 1500
    discount: 50,
    totalAmount: 1720,
    paymentStatus: 'Paid',
    billDate: '2024-07-28',
    invoiceNumber: 'INV-B-003',
  },
];
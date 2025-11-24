
import { InventoryItem, InventoryItemCategory, InventoryTransaction, TransactionType, PurchaseOrder, Vendor } from '../types';
import { MOCK_INVENTORY_ITEMS, MOCK_VENDORS } from '../constants';

const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

let inventoryItemsData: InventoryItem[] = [...MOCK_INVENTORY_ITEMS];
let inventoryTransactionsData: InventoryTransaction[] = [];
let purchaseOrdersData: PurchaseOrder[] = [];
let vendorsData: Vendor[] = [...MOCK_VENDORS];

export const inventoryService = {
  // --- Inventory Items ---
  getInventoryItems: async (category?: InventoryItemCategory): Promise<InventoryItem[]> => {
    await simulateNetworkDelay();
    return category ? inventoryItemsData.filter(item => item.category === category) : inventoryItemsData;
  },

  getInventoryItemById: async (id: string): Promise<InventoryItem | undefined> => {
    await simulateNetworkDelay();
    return inventoryItemsData.find(item => item.id === id);
  },

  addInventoryItem: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    await simulateNetworkDelay();
    const newItem = { id: `inv-${Date.now()}`, ...item };
    inventoryItemsData.push(newItem);
    return newItem;
  },

  updateInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    await simulateNetworkDelay();
    const index = inventoryItemsData.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('Inventory item not found');
    inventoryItemsData[index] = item;
    return item;
  },

  deleteInventoryItem: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    inventoryItemsData = inventoryItemsData.filter(i => i.id !== id);
  },

  // --- Inventory Transactions ---
  recordTransaction: async (
    itemId: string,
    transactionType: TransactionType,
    quantity: number,
    processedByUserId: string,
    notes?: string,
    relatedOrderId?: string
  ): Promise<InventoryTransaction> => {
    await simulateNetworkDelay();
    const itemIndex = inventoryItemsData.findIndex(item => item.id === itemId);
    if (itemIndex === -1) throw new Error('Inventory item not found for transaction');

    const item = inventoryItemsData[itemIndex];

    switch (transactionType) {
      case TransactionType.StockIn:
        item.currentStock += quantity;
        item.lastPurchaseDate = new Date().toISOString().split('T')[0];
        break;
      case TransactionType.StockOut:
        if (item.currentStock < quantity) throw new Error('Insufficient stock for Stock-Out');
        item.currentStock -= quantity;
        item.lastConsumptionDate = new Date().toISOString().split('T')[0];
        break;
      case TransactionType.Adjustment:
        item.currentStock += quantity; // Quantity can be positive or negative for adjustment
        break;
      case TransactionType.Wastage:
        if (item.currentStock < quantity) throw new Error('Insufficient stock for Wastage');
        item.currentStock -= quantity;
        break;
    }
    inventoryItemsData[itemIndex] = item; // Update item in data store

    const newTransaction: InventoryTransaction = {
      id: `trn-${Date.now()}`,
      itemId,
      itemName: item.name,
      transactionType,
      quantity,
      date: new Date().toISOString(),
      notes,
      relatedOrderId,
      processedByUserId,
    };
    inventoryTransactionsData.push(newTransaction);
    return newTransaction;
  },

  getTransactions: async (itemId?: string): Promise<InventoryTransaction[]> => {
    await simulateNetworkDelay();
    return itemId ? inventoryTransactionsData.filter(t => t.itemId === itemId) : inventoryTransactionsData;
  },

  // --- Purchase Orders ---
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    await simulateNetworkDelay();
    return purchaseOrdersData;
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder | undefined> => {
    await simulateNetworkDelay();
    return purchaseOrdersData.find(po => po.id === id);
  },

  addPurchaseOrder: async (order: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    await simulateNetworkDelay();
    const newOrder = { id: `po-${Date.now()}`, ...order };
    purchaseOrdersData.push(newOrder);
    return newOrder;
  },

  updatePurchaseOrder: async (order: PurchaseOrder): Promise<PurchaseOrder> => {
    await simulateNetworkDelay();
    const index = purchaseOrdersData.findIndex(po => po.id === order.id);
    if (index === -1) throw new Error('Purchase order not found');
    purchaseOrdersData[index] = order;
    return order;
  },

  receivePurchaseOrder: async (orderId: string, processedByUserId: string): Promise<PurchaseOrder> => {
    await simulateNetworkDelay();
    const orderIndex = purchaseOrdersData.findIndex(po => po.id === orderId);
    if (orderIndex === -1) throw new Error('Purchase order not found');

    const order = purchaseOrdersData[orderIndex];
    order.status = 'Received';

    // Update inventory for each item in the purchase order
    for (const item of order.items) {
      await inventoryService.recordTransaction(item.itemId, TransactionType.StockIn, item.quantity, processedByUserId, `Received from PO ${order.id}`);
    }
    return order;
  },

  // --- Vendors ---
  getVendors: async (): Promise<Vendor[]> => {
    await simulateNetworkDelay();
    return vendorsData;
  },

  getVendorById: async (id: string): Promise<Vendor | undefined> => {
    await simulateNetworkDelay();
    return vendorsData.find(vendor => vendor.id === id);
  },

  addVendor: async (vendor: Omit<Vendor, 'id'>): Promise<Vendor> => {
    await simulateNetworkDelay();
    const newVendor = { id: `vnd-${Date.now()}`, ...vendor };
    vendorsData.push(newVendor);
    return newVendor;
  },

  updateVendor: async (vendor: Vendor): Promise<Vendor> => {
    await simulateNetworkDelay();
    const index = vendorsData.findIndex(v => v.id === vendor.id);
    if (index === -1) throw new Error('Vendor not found');
    vendorsData[index] = vendor;
    return vendor;
  },

  deleteVendor: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    vendorsData = vendorsData.filter(v => v.id !== id);
  },

  // --- Alerts ---
  getLowStockAlerts: async (): Promise<InventoryItem[]> => {
    await simulateNetworkDelay();
    return inventoryItemsData.filter(item => item.currentStock <= item.minStockLevel);
  },

  getExpiryAlerts: async (daysThreshold: number = 30): Promise<InventoryItem[]> => {
    await simulateNetworkDelay();
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);

    return inventoryItemsData.filter(item =>
      item.expiryDate && new Date(item.expiryDate) <= thresholdDate
    );
  },
};

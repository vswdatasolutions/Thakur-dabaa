

import { BarMenuItem, BarOrder, OrderItem, LiquorBottle, MenuItemCategory } from '../types';
import { MOCK_BAR_MENU_ITEMS, MOCK_LIQUOR_BOTTLES } from '../constants';

const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

let barMenuItemsData: BarMenuItem[] = [...MOCK_BAR_MENU_ITEMS];
let barOrdersData: BarOrder[] = [];
let liquorBottlesData: LiquorBottle[] = [...MOCK_LIQUOR_BOTTLES];

export const barService = {
  // --- Menu Items ---
  getMenuItems: async (category?: MenuItemCategory): Promise<BarMenuItem[]> => {
    await simulateNetworkDelay();
    return category ? barMenuItemsData.filter(item => item.category === category) : barMenuItemsData;
  },

  getMenuItemById: async (id: string): Promise<BarMenuItem | undefined> => {
    await simulateNetworkDelay();
    return barMenuItemsData.find(item => item.id === id);
  },

  addMenuItem: async (item: Omit<BarMenuItem, 'id'>): Promise<BarMenuItem> => {
    await simulateNetworkDelay();
    const newItem = { id: `bmi-${Date.now()}`, ...item };
    barMenuItemsData.push(newItem);
    return newItem;
  },

  updateMenuItem: async (item: BarMenuItem): Promise<BarMenuItem> => {
    await simulateNetworkDelay();
    const index = barMenuItemsData.findIndex(i => i.id === item.id);
    if (index === -1) throw new Error('Menu item not found');
    barMenuItemsData[index] = item;
    return item;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    barMenuItemsData = barMenuItemsData.filter(i => i.id !== id);
  },

  // --- Bar Orders (POS) ---
  placeOrder: async (tableNumber: string, items: OrderItem[], discount: number = 0): Promise<BarOrder> => {
    await simulateNetworkDelay();

    let subtotal = 0;
    for (const orderItem of items) {
      const menuItem = barMenuItemsData.find(m => m.id === orderItem.menuItemId);
      if (!menuItem || menuItem.stockQuantity < orderItem.quantity) {
        throw new Error(`Insufficient stock for ${orderItem.name}`);
      }
      subtotal += orderItem.quantity * orderItem.price;
    }

    const gstRate = 0.18; // 18% GST (example)
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount - discount;

    const newOrder: BarOrder = {
      id: `bor-${Date.now()}`,
      tableNumber,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paymentStatus: 'Pending',
      orderDate: new Date().toISOString(),
      isKOTPrinted: false,
    };
    barOrdersData.push(newOrder);

    // Deduct stock for bar menu items and potentially liquor bottles
    for (const orderItem of items) {
      const menuItemIndex = barMenuItemsData.findIndex(m => m.id === orderItem.menuItemId);
      if (menuItemIndex > -1) {
        barMenuItemsData[menuItemIndex].stockQuantity -= orderItem.quantity;

        // If it's a liquor item, deduct from the associated bottle
        if (barMenuItemsData[menuItemIndex].bottleId) {
          const bottle = liquorBottlesData.find(b => b.id === barMenuItemsData[menuItemIndex].bottleId);
          if (bottle) {
            // Fix: Access pegSizeMl from the LiquorBottle, not BarMenuItem
            bottle.currentVolumeMl -= (orderItem.quantity * bottle.pegSizeMl);
          }
        }
      }
    }

    return newOrder;
  },

  getOrders: async (status?: 'Paid' | 'Pending'): Promise<BarOrder[]> => {
    await simulateNetworkDelay();
    return status ? barOrdersData.filter(order => order.paymentStatus === status) : barOrdersData;
  },

  getOrderById: async (id: string): Promise<BarOrder | undefined> => {
    await simulateNetworkDelay();
    return barOrdersData.find(order => order.id === id);
  },

  updateOrderStatus: async (id: string, updates: Partial<BarOrder>): Promise<BarOrder> => {
    await simulateNetworkDelay();
    const index = barOrdersData.findIndex(order => order.id === id);
    if (index === -1) throw new Error('Order not found');
    barOrdersData[index] = { ...barOrdersData[index], ...updates };
    return barOrdersData[index];
  },

  splitBill: async (orderId: string, splitAmount: number): Promise<BarOrder[]> => {
    await simulateNetworkDelay();
    const originalOrder = barOrdersData.find(order => order.id === orderId);
    if (!originalOrder) throw new Error('Original order not found');

    if (splitAmount >= originalOrder.totalAmount) {
      throw new Error('Split amount must be less than total bill amount.');
    }

    // This is a simplified split. In a real app, you might split by item or create multiple partial bills.
    const splitBill1: BarOrder = {
      ...originalOrder,
      id: `bor-${Date.now()}-s1`,
      totalAmount: splitAmount,
      paymentStatus: 'Paid', // Assuming the split part is paid
      orderDate: new Date().toISOString(),
      isKOTPrinted: true, // Assuming KOT was already printed for original
    };

    const splitBill2: BarOrder = {
      ...originalOrder,
      id: `bor-${Date.now()}-s2`,
      totalAmount: originalOrder.totalAmount - splitAmount,
      paymentStatus: 'Pending',
      orderDate: new Date().toISOString(),
      isKOTPrinted: true,
    };

    // Remove original order and add split bills
    barOrdersData = barOrdersData.filter(order => order.id !== orderId);
    barOrdersData.push(splitBill1, splitBill2);

    return [splitBill1, splitBill2];
  },

  // --- Liquor Inventory ---
  getLiquorBottles: async (): Promise<LiquorBottle[]> => {
    await simulateNetworkDelay();
    return liquorBottlesData;
  },

  getLiquorBottleById: async (id: string): Promise<LiquorBottle | undefined> => {
    await simulateNetworkDelay();
    return liquorBottlesData.find(bottle => bottle.id === id);
  },

  addLiquorBottle: async (bottle: Omit<LiquorBottle, 'id'>): Promise<LiquorBottle> => {
    await simulateNetworkDelay();
    const newBottle = { id: `liq-${Date.now()}`, ...bottle };
    liquorBottlesData.push(newBottle);
    return newBottle;
  },

  updateLiquorBottle: async (bottle: LiquorBottle): Promise<LiquorBottle> => {
    await simulateNetworkDelay();
    const index = liquorBottlesData.findIndex(b => b.id === bottle.id);
    if (index === -1) throw new Error('Liquor bottle not found');
    liquorBottlesData[index] = bottle;
    return bottle;
  },

  // Fix: Added deleteLiquorBottle method
  deleteLiquorBottle: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    liquorBottlesData = liquorBottlesData.filter(b => b.id !== id);
  },

  recordWastage: async (bottleId: string, wastageMl: number): Promise<LiquorBottle> => {
    await simulateNetworkDelay();
    const bottleIndex = liquorBottlesData.findIndex(b => b.id === bottleId);
    if (bottleIndex === -1) throw new Error('Liquor bottle not found');
    liquorBottlesData[bottleIndex].currentVolumeMl -= wastageMl;
    liquorBottlesData[bottleIndex].wastageMl += wastageMl;
    return liquorBottlesData[bottleIndex];
  },

  getDailyLiquorUsage: async (date: string): Promise<{ bottleId: string; bottleName: string; usedMl: number; wastageMl: number }[]> => {
    await simulateNetworkDelay();
    // This is a highly simplified mock. In a real system, you'd track transactions per bottle per day.
    // For now, we'll just report current wastage for bottles.
    return liquorBottlesData.map(bottle => ({
      bottleId: bottle.id,
      bottleName: bottle.name,
      usedMl: bottle.totalVolumeMl - bottle.currentVolumeMl - bottle.wastageMl, // Simplistic 'used' calculation
      wastageMl: bottle.wastageMl,
    }));
  },
};
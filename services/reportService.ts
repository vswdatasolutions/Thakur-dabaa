
import { SalesReportEntry, InventoryReportEntry, StaffReportEntry, GSTReportEntry } from '../types';
import { MOCK_REPORTS } from '../constants';

const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const reportService = {
  getSalesReport: async (startDate: string, endDate: string): Promise<SalesReportEntry[]> => {
    await simulateNetworkDelay();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return MOCK_REPORTS.sales.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= start && reportDate <= end;
    });
  },

  getInventoryReport: async (date: string): Promise<InventoryReportEntry[]> => {
    await simulateNetworkDelay();
    // In a real system, this would be generated based on transactions up to the given date.
    // For mock, we'll just return the current mock inventory report.
    return MOCK_REPORTS.inventory;
  },

  getStaffReport: async (startDate: string, endDate: string): Promise<StaffReportEntry[]> => {
    await simulateNetworkDelay();
    // Mock data doesn't have time-based staff data, so return all mock staff.
    return MOCK_REPORTS.staff;
  },

  getGSTReport: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly', date?: string): Promise<GSTReportEntry[]> => {
    await simulateNetworkDelay();
    // Simplified mock: return all GST entries. Real implementation would filter by period.
    return MOCK_REPORTS.gst;
  },

  // --- Dashboard Aggregates ---
  getDashboardSummary: async (): Promise<{
    occupancyToday: number;
    totalRooms: number;
    revenueToday: number;
    barSalesToday: number;
    lowStockItemsCount: number;
  }> => {
    await simulateNetworkDelay();
    const today = new Date().toISOString().split('T')[0];
    const todaySales = MOCK_REPORTS.sales.find(s => s.date === today);

    // Mock occupancy calculation
    const occupiedRooms = 4; // Hardcoded for simplicity
    const totalRooms = 10; // Hardcoded for simplicity

    return {
      occupancyToday: occupiedRooms,
      totalRooms: totalRooms,
      revenueToday: todaySales?.totalRevenue || 0,
      barSalesToday: todaySales?.barRevenue || 0,
      lowStockItemsCount: MOCK_REPORTS.inventory.filter(item => item.closingStock <= 5).length, // Example threshold
    };
  },
};
import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import Card from '../components/common/Card';
import { InventoryItem } from '../types';
import { inventoryService } from '../services/inventoryService';
// Fix: Added import for Button component
import Button from '../components/common/Button';

interface DashboardSummary {
  occupancyToday: number;
  totalRooms: number;
  revenueToday: number;
  barSalesToday: number;
  lowStockItemsCount: number;
}

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const summaryData = await reportService.getDashboardSummary();
        setSummary(summaryData);

        const lowStock = await inventoryService.getLowStockAlerts();
        setLowStockAlerts(lowStock);

        const expiry = await inventoryService.getExpiryAlerts(30); // Items expiring in next 30 days
        setExpiryAlerts(expiry);

      } catch (err: any) {
        setError(`Failed to load dashboard data: ${err.message}`);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-center p-8 text-xl">
        {error}
      </div>
    );
  }

  const occupancyPercentage = summary && summary.totalRooms > 0
    ? ((summary.occupancyToday / summary.totalRooms) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-8 p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Occupancy Today" className="bg-blue-100 dark:bg-[#5C86AA]">
          <p className="text-5xl font-bold text-blue-800 dark:text-[#1F2D3A]">{occupancyPercentage}%</p>
          <p className="text-xl text-blue-700 dark:text-[#C7C0B0] mt-2">{summary?.occupancyToday} / {summary?.totalRooms} Rooms Occupied</p>
        </Card>
        <Card title="Revenue Today" className="bg-green-100 dark:bg-green-700">
          <p className="text-5xl font-bold text-green-800 dark:text-green-100">₹ {summary?.revenueToday.toLocaleString('en-IN')}</p>
          <p className="text-xl text-green-700 dark:text-green-200 mt-2">Total sales so far</p>
        </Card>
        <Card title="Bar Sales Today" className="bg-purple-100 dark:bg-purple-700">
          <p className="text-5xl font-bold text-purple-800 dark:text-purple-100">₹ {summary?.barSalesToday.toLocaleString('en-IN')}</p>
          <p className="text-xl text-purple-700 dark:text-purple-200 mt-2">Liquor & F&B sales</p>
        </Card>
        <Card title="Low Stock Items" className="bg-yellow-100 dark:bg-yellow-700">
          <p className="text-5xl font-bold text-yellow-800 dark:text-yellow-100">{summary?.lowStockItemsCount}</p>
          <p className="text-xl text-yellow-700 dark:text-yellow-200 mt-2">Items need reordering</p>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Critical Low Stock Alerts" className="bg-red-100 dark:bg-red-700 border-l-4 border-red-500">
          {lowStockAlerts.length > 0 ? (
            <ul className="list-disc list-inside text-xl space-y-2 text-red-800 dark:text-red-100">
              {lowStockAlerts.map(item => (
                <li key={item.id} className="flex justify-between items-center">
                  <span>{item.name} ({item.category})</span>
                  <span className="font-bold">{item.currentStock} {item.unit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl text-red-700 dark:text-red-200">No critical low stock alerts.</p>
          )}
        </Card>

        <Card title="Upcoming Expiry Alerts (30 days)" className="bg-orange-100 dark:bg-orange-700 border-l-4 border-orange-500">
          {expiryAlerts.length > 0 ? (
            <ul className="list-disc list-inside text-xl space-y-2 text-orange-800 dark:text-orange-100">
              {expiryAlerts.map(item => (
                <li key={item.id} className="flex justify-between items-center">
                  <span>{item.name} ({item.category})</span>
                  <span className="font-bold">Expires: {item.expiryDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl text-orange-700 dark:text-orange-200">No upcoming expiry alerts.</p>
          )}
        </Card>
      </div>

      {/* Placeholder for other dashboard elements like quick links or small charts */}
      <Card title="Quick Actions" className="bg-gray-50 dark:bg-[#4C769A]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xl">
          <Button variant="secondary">New Booking</Button>
          <Button variant="secondary">Process Order</Button>
          <Button variant="secondary">Stock Adjustment</Button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
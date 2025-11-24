import React, { useEffect, useState } from 'react';
import { reportService } from '../../services/reportService';
import { SalesReportEntry, InventoryReportEntry, StaffReportEntry, GSTReportEntry, ModalType, ChartDataPoint } from '../../types';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { geminiService } from '../../services/geminiService';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'staff' | 'gst'>('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Report Data States
  const [salesReport, setSalesReport] = useState<SalesReportEntry[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportEntry[]>([]);
  const [staffReport, setStaffReport] = useState<StaffReportEntry[]>([]);
  const [gstReport, setGstReport] = useState<GSTReportEntry[]>([]);

  // AI Assistant Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sales, inventory, staff, gst] = await Promise.all([
        reportService.getSalesReport(startDate, endDate),
        reportService.getInventoryReport(new Date().toISOString().split('T')[0]), // Inventory is often current snapshot
        reportService.getStaffReport(startDate, endDate),
        reportService.getGSTReport('daily', new Date().toISOString().split('T')[0]),
      ]);
      setSalesReport(sales);
      setInventoryReport(inventory);
      setStaffReport(staff);
      setGstReport(gst);
    } catch (err: any) {
      setError(`Failed to fetch reports: ${err.message}`);
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab]); // Re-fetch when date range or tab changes

  const handleAiQuery = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      // Provide context to the AI based on the current active tab
      let context = '';
      switch (activeTab) {
        case 'sales':
          context = `Based on the following sales data (date, hotelRevenue, barRevenue, totalRevenue, gstCollected, discountsGiven): \n${JSON.stringify(salesReport, null, 2)}\n\n`;
          break;
        case 'inventory':
          context = `Based on the following inventory data (itemId, itemName, category, unit, openingStock, stockIn, stockOut, wastage, closingStock): \n${JSON.stringify(inventoryReport, null, 2)}\n\n`;
          break;
        case 'staff':
          context = `Based on the following staff report data (staffId, staffName, role, hoursWorked, tasksCompleted, salesGenerated): \n${JSON.stringify(staffReport, null, 2)}\n\n`;
          break;
        case 'gst':
          context = `Based on the following GST report data (date, invoiceNumber, customerName, gstType, gstRate, taxableAmount, gstAmount): \n${JSON.stringify(gstReport, null, 2)}\n\n`;
          break;
        default:
          break;
      }
      const fullPrompt = `${context} ${aiPrompt}.`;
      const response = await geminiService.generateText(fullPrompt, `You are a helpful reports assistant. Analyze the provided data and answer the user's question. If you cannot answer based on the data, state that.`);
      setAiResponse(response);
    } catch (err: any) {
      setAiResponse(`Error processing AI query: ${err.message}`);
      console.error('AI query error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const salesChartData: ChartDataPoint[] = salesReport.map(r => ({ name: r.date, value: r.totalRevenue }));

  const salesColumns = [
    { key: 'date', header: 'Date' },
    { key: 'hotelRevenue', header: 'Hotel Revenue (₹)', render: (r: SalesReportEntry) => r.hotelRevenue.toLocaleString('en-IN') },
    { key: 'barRevenue', header: 'Bar Revenue (₹)', render: (r: SalesReportEntry) => r.barRevenue.toLocaleString('en-IN') },
    { key: 'totalRevenue', header: 'Total Revenue (₹)', render: (r: SalesReportEntry) => r.totalRevenue.toLocaleString('en-IN') },
    { key: 'gstCollected', header: 'GST Collected (₹)', render: (r: SalesReportEntry) => r.gstCollected.toLocaleString('en-IN') },
    { key: 'discountsGiven', header: 'Discounts (₹)', render: (r: SalesReportEntry) => r.discountsGiven.toLocaleString('en-IN') },
  ];

  const inventoryColumns = [
    { key: 'itemName', header: 'Item Name' },
    { key: 'category', header: 'Category' },
    { key: 'openingStock', header: 'Opening Stock' },
    { key: 'stockIn', header: 'Stock In' },
    { key: 'stockOut', header: 'Stock Out' },
    { key: 'wastage', header: 'Wastage' },
    { key: 'closingStock', header: 'Closing Stock' },
  ];

  const staffColumns = [
    { key: 'staffName', header: 'Staff Name' },
    { key: 'role', header: 'Role' },
    { key: 'hoursWorked', header: 'Hours Worked' },
    { key: 'tasksCompleted', header: 'Tasks Completed' },
    { key: 'salesGenerated', header: 'Sales Generated (₹)', render: (s: StaffReportEntry) => (s.salesGenerated || 0).toLocaleString('en-IN') },
  ];

  const gstColumns = [
    { key: 'date', header: 'Date' },
    { key: 'invoiceNumber', header: 'Invoice No.' },
    { key: 'customerName', header: 'Customer' },
    { key: 'gstType', header: 'GST Type' },
    { key: 'gstRate', header: 'Rate (%)' },
    { key: 'taxableAmount', header: 'Taxable Amt (₹)', render: (g: GSTReportEntry) => g.taxableAmount.toLocaleString('en-IN') },
    { key: 'gstAmount', header: 'GST Amt (₹)', render: (g: GSTReportEntry) => g.gstAmount.toLocaleString('en-IN') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Reports & Analytics</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      {/* Date Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button variant="primary" size="lg" onClick={fetchReports} className="w-full sm:w-auto">
            Apply Filters
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setIsAiModalOpen(true)} className="w-full sm:w-auto ml-auto">
            <span className="text-xl">🤖</span> AI Report Assistant
          </Button>
        </div>
      </Card>


      {/* Report Tabs */}
      <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-[#2A3C4C] pb-3">
        <Button variant={activeTab === 'sales' ? 'primary' : 'secondary'} size="lg" onClick={() => setActiveTab('sales')}>
          Sales Report
        </Button>
        <Button variant={activeTab === 'inventory' ? 'primary' : 'secondary'} size="lg" onClick={() => setActiveTab('inventory')}>
          Inventory Report
        </Button>
        <Button variant={activeTab === 'staff' ? 'primary' : 'secondary'} size="lg" onClick={() => setActiveTab('staff')}>
          Staff Report
        </Button>
        <Button variant={activeTab === 'gst' ? 'primary' : 'secondary'} size="lg" onClick={() => setActiveTab('gst')}>
          GST Report
        </Button>
      </div>

      {/* Report Content */}
      <Card>
        {activeTab === 'sales' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Sales Report</h2>
            <div className="h-80 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-[#5C86AA]" />
                  <XAxis dataKey="name" stroke="#6b7280" className="dark:text-[#C7C0B0]" />
                  <YAxis stroke="#6b7280" className="dark:text-[#C7C0B0]" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderColor: '#ccc', borderRadius: '8px', padding: '10px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ color: '#333' }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Total Revenue" fill="#8884d8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table columns={salesColumns} data={salesReport} emptyMessage="No sales data for this period." />
          </>
        )}
        {activeTab === 'inventory' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Inventory Report</h2>
            <Table columns={inventoryColumns} data={inventoryReport} emptyMessage="No inventory data." />
          </>
        )}
        {activeTab === 'staff' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Staff Report</h2>
            <Table columns={staffColumns} data={staffReport} emptyMessage="No staff data." />
          </>
        )}
        {activeTab === 'gst' && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">GST Report</h2>
            <Table columns={gstColumns} data={gstReport} emptyMessage="No GST data." />
          </>
        )}
      </Card>

      {/* AI Report Assistant Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => { setIsAiModalOpen(false); setAiPrompt(''); setAiResponse(''); }}
        title="AI Report Assistant"
        size="lg"
      >
        <div className="space-y-4 text-xl">
          <p className="text-gray-700 dark:text-[#C7C0B0]">Ask the AI questions about your {activeTab} reports:</p>
          <Input
            label="Your Question"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., 'What was the total revenue for the first week of July?' or 'List all low stock items in the inventory report.'"
            className="w-full"
          />
          <Button variant="primary" size="md" onClick={handleAiQuery} isLoading={isAiLoading} disabled={!aiPrompt.trim()} className="w-full">
            Ask AI
          </Button>
          {aiResponse && (
            <Card className="mt-4 bg-blue-50 dark:bg-[#2A3C4C]">
              <h3 className="font-semibold text-blue-800 dark:text-[#F5F0E1] mb-2">AI Response:</h3>
              <p className="whitespace-pre-wrap text-blue-700 dark:text-[#C7C0B0]">{aiResponse}</p>
            </Card>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;
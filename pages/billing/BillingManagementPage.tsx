import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Bill, BillItem, Booking, Guest, UserRole, ModalType } from '../../types';
import { hotelService } from '../../services/hotelService';
import { barService } from '../../services/barService'; // To fetch bar orders
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';

const BillingManagementPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDateRange, setFilterDateRange] = useState({ startDate: '', endDate: '' });
  const [filterGuestName, setFilterGuestName] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<Bill['paymentStatus'] | 'All'>('All');
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(ModalType.None);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [billForm, setBillForm] = useState<Omit<Bill, 'id' | 'items'>>({
    bookingId: '',
    guestId: '',
    roomNumber: '',
    subtotal: 0,
    gstAmount: 0,
    discount: 0,
    totalAmount: 0,
    paymentStatus: 'Pending',
    billDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
  });
  const [billItemsForm, setBillItemsForm] = useState<BillItem[]>([]);
  const [newBillItem, setNewBillItem] = useState<Omit<BillItem, 'id'>>({ description: '', quantity: 1, unitPrice: 0, total: 0, category: 'Other' });

  const { hasPermission } = useAuth();
  const canManageBilling = hasPermission('canManageBilling');

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedBills, fetchedBookings, fetchedGuests, fetchedBarOrders] = await Promise.all([
        hotelService.getBills(),
        hotelService.getBookings(),
        hotelService.getGuests(),
        barService.getOrders('Paid'), // Only show paid bar orders as bills initially
      ]);

      // Combine hotel bills and paid bar orders into a unified bill list
      const combinedBills: Bill[] = [
        ...fetchedBills,
        ...fetchedBarOrders.map(order => ({
          id: `barbill-${order.id}`, // Prefix to distinguish from hotel bills
          bookingId: undefined,
          guestId: undefined, // Bar orders might not have a guest ID directly
          roomNumber: order.tableNumber.startsWith('Room ') ? order.tableNumber.replace('Room ', '') : undefined,
          items: order.items.map(item => ({
            id: `baritem-${item.menuItemId}-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Ensure unique ID for bill items
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            // Fix: Explicitly cast category to BillItem['category']
            category: 'Food & Beverage' as BillItem['category'],
          })),
          subtotal: order.subtotal,
          gstAmount: order.gstAmount,
          discount: order.discount,
          totalAmount: order.totalAmount,
          // Fix: Directly assign order.paymentStatus as it's compatible with Bill['paymentStatus']
          paymentStatus: order.paymentStatus,
          billDate: order.orderDate.split('T')[0],
          invoiceNumber: `INV-B-${order.id.split('-').pop()}`, // Derive from bar order ID
        }) as Bill), // Fix: Explicitly cast the entire mapped object to Bill
      ];

      setBills(combinedBills);
      setBookings(fetchedBookings);
      setGuests(fetchedGuests);
    } catch (err: any) {
      setError(`Failed to fetch billing data: ${err.message}`);
      console.error('Billing data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const calculateBillTotals = (items: BillItem[], discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstRate = 0.18; // Example GST rate
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount - discount;
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  };

  const handleBillFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setBillForm(prev => {
      const updatedForm = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      };

      // Recalculate totals if discount changes
      if (name === 'discount' || name === 'gstAmount') {
        const currentDiscount = name === 'discount' ? parseFloat(value) : updatedForm.discount;
        const currentItems = billItemsForm;
        const { subtotal, gstAmount, totalAmount } = calculateBillTotals(currentItems, currentDiscount);
        return {
          ...updatedForm,
          subtotal,
          gstAmount,
          totalAmount,
        };
      }
      return updatedForm;
    });
  };

  const handleBillItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedItems = billItemsForm.map((item, i) => {
      if (i === index) {
        const updatedItem = {
          ...item,
          [name]: type === 'number' ? parseFloat(value) : value,
        };
        // Recalculate total for the item
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        return updatedItem;
      }
      return item;
    });
    setBillItemsForm(updatedItems);
    // Recalculate bill totals
    const { subtotal, gstAmount, totalAmount } = calculateBillTotals(updatedItems, billForm.discount);
    setBillForm(prev => ({ ...prev, subtotal, gstAmount, totalAmount }));
  };

  const handleNewBillItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewBillItem(prev => {
      const updatedItem = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      };
      // Recalculate total for the new item
      updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
      return updatedItem;
    });
  };

  const handleAddBillItem = () => {
    if (newBillItem.description && newBillItem.quantity > 0 && newBillItem.unitPrice >= 0) {
      setBillItemsForm(prev => [...prev, { ...newBillItem, id: `item-${Date.now()}` }]);
      setNewBillItem({ description: '', quantity: 1, unitPrice: 0, total: 0, category: 'Other' });
      // Recalculate bill totals
      const { subtotal, gstAmount, totalAmount } = calculateBillTotals([...billItemsForm, { ...newBillItem, id: `item-${Date.now()}` }], billForm.discount);
      setBillForm(prev => ({ ...prev, subtotal, gstAmount, totalAmount }));
    } else {
      alert('Please fill in all details for the new item.');
    }
  };

  const handleRemoveBillItem = (id: string) => {
    const updatedItems = billItemsForm.filter(item => item.id !== id);
    setBillItemsForm(updatedItems);
    // Recalculate bill totals
    const { subtotal, gstAmount, totalAmount } = calculateBillTotals(updatedItems, billForm.discount);
    setBillForm(prev => ({ ...prev, subtotal, gstAmount, totalAmount }));
  };

  const openBillModal = (bill?: Bill) => {
    if (bill) {
      setCurrentBill(bill);
      setBillForm({ ...bill });
      setBillItemsForm([...bill.items]);
    } else {
      setCurrentBill(null);
      setBillForm({
        bookingId: '',
        guestId: '',
        roomNumber: '',
        subtotal: 0,
        gstAmount: 0,
        discount: 0,
        totalAmount: 0,
        paymentStatus: 'Pending',
        billDate: new Date().toISOString().split('T')[0],
        invoiceNumber: `INV-H-${Date.now().toString().slice(-6)}`,
      });
      setBillItemsForm([]);
    }
    setNewBillItem({ description: '', quantity: 1, unitPrice: 0, total: 0, category: 'Other' });
    setModalType(ModalType.AddEditBill);
    setIsModalOpen(true);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { subtotal, gstAmount, totalAmount, ...restOfBillForm } = billForm;
    const finalBillData = {
      ...restOfBillForm,
      items: billItemsForm,
      ...calculateBillTotals(billItemsForm, billForm.discount), // Ensure totals are recalculated just before saving
    };

    try {
      if (currentBill) {
        await hotelService.updateBill({ ...finalBillData, id: currentBill.id } as Bill);
        alert('Bill updated successfully!');
      } else {
        await hotelService.addBill(finalBillData as Omit<Bill, 'id'>);
        alert('Bill added successfully!');
      }
      fetchBillingData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(`Failed to save bill: ${err.message}`);
      console.error('Save bill error:', err);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!canManageBilling) {
      alert('You do not have permission to delete bills.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await hotelService.deleteBill(billId);
      alert('Bill deleted successfully!');
      fetchBillingData();
    } catch (err: any) {
      setError(`Failed to delete bill: ${err.message}`);
      console.error('Delete bill error:', err);
    }
  };

  const handleUpdatePaymentStatus = async (billId: string, status: Bill['paymentStatus']) => {
    if (!canManageBilling) {
      alert('You do not have permission to update payment status.');
      return;
    }
    try {
      await hotelService.updateBillPaymentStatus(billId, status);
      alert(`Bill ${billId} payment status updated to ${status}!`);
      fetchBillingData();
    } catch (err: any) {
      setError(`Failed to update payment status: ${err.message}`);
      console.error('Update payment status error:', err);
    }
  };

  const handlePrintBill = (bill: Bill) => {
    console.log('Printing Bill:', bill);
    // This would typically open a print-friendly view or trigger a backend print service
    alert(`Simulating print for Invoice: ${bill.invoiceNumber}`);
    // A more robust solution would involve rendering the bill in a new window/iframe for printing.
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Invoice ${bill.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; margin: 20px; color: #333; }
            .invoice-header { text-align: center; margin-bottom: 30px; }
            .invoice-header h1 { margin: 0; color: #007bff; }
            .invoice-details, .bill-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .invoice-details td, .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .bill-items th { background-color: #f2f2f2; }
            .totals { float: right; width: 50%; }
            .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
            .totals div:last-child { font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>HotelNest Invoice</h1>
            <p>Invoice No: <strong>${bill.invoiceNumber}</strong></p>
            <p>Date: ${bill.billDate}</p>
          </div>
          <table class="invoice-details">
            <tr>
              <td><strong>Booking ID:</strong> ${bill.bookingId || 'N/A'}</td>
              <td><strong>Guest:</strong> ${guests.find(g => g.id === bill.guestId)?.name || 'Walk-in'}</td>
            </tr>
            <tr>
              <td><strong>Room No:</strong> ${bill.roomNumber || 'N/A'}</td>
              <td><strong>Payment Status:</strong> ${bill.paymentStatus}</td>
            </tr>
          </table>
          <h3>Bill Items</h3>
          <table class="bill-items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toLocaleString('en-IN')}</td>
                  <td>${item.total.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal:</span><span>₹${bill.subtotal.toLocaleString('en-IN')}</span></div>
            <div><span>GST Amount:</span><span>₹${bill.gstAmount.toLocaleString('en-IN')}</span></div>
            <div><span>Discount:</span><span>- ₹${bill.discount.toLocaleString('en-IN')}</span></div>
            <div><span>Total Amount:</span><span>₹${bill.totalAmount.toLocaleString('en-IN')}</span></div>
          </div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const billDate = new Date(bill.billDate);
      const start = filterDateRange.startDate ? new Date(filterDateRange.startDate) : null;
      const end = filterDateRange.endDate ? new Date(filterDateRange.endDate) : null;

      const matchesDate = (!start || billDate >= start) && (!end || billDate <= end);
      const matchesGuest = !filterGuestName || (guests.find(g => g.id === bill.guestId)?.name || '').toLowerCase().includes(filterGuestName.toLowerCase());
      const matchesPaymentStatus = filterPaymentStatus === 'All' || bill.paymentStatus === filterPaymentStatus;
      const matchesInvoiceNumber = !filterInvoiceNumber || bill.invoiceNumber.toLowerCase().includes(filterInvoiceNumber.toLowerCase());

      return matchesDate && matchesGuest && matchesPaymentStatus && matchesInvoiceNumber;
    });
  }, [bills, filterDateRange, filterGuestName, filterPaymentStatus, filterInvoiceNumber, guests]);

  const billColumns = [
    { key: 'invoiceNumber', header: 'Invoice No.', className: 'font-semibold' },
    { key: 'billDate', header: 'Date' },
    {
      key: 'guestName',
      header: 'Guest/Room',
      render: (bill: Bill) => {
        const guest = guests.find(g => g.id === bill.guestId);
        return guest ? guest.name : (bill.roomNumber ? `Room ${bill.roomNumber}` : 'Walk-in');
      },
      className: 'font-medium',
    },
    { key: 'subtotal', header: 'Subtotal (₹)', render: (b: Bill) => b.subtotal.toLocaleString('en-IN') },
    { key: 'gstAmount', header: 'GST (₹)', render: (b: Bill) => b.gstAmount.toLocaleString('en-IN') },
    { key: 'discount', header: 'Discount (₹)', render: (b: Bill) => b.discount.toLocaleString('en-IN') },
    { key: 'totalAmount', header: 'Total (₹)', render: (b: Bill) => b.totalAmount.toLocaleString('en-IN'), className: 'font-bold' },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (bill: Bill) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold
          ${bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
            bill.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
            'bg-blue-100 text-blue-800 dark:bg-[#5C86AA] dark:text-[#1F2D3A]'
          }`}
        >
          {bill.paymentStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (bill: Bill) => canManageBilling ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => openBillModal(bill)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteBill(bill.id)}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => handlePrintBill(bill)}>Print</Button>
          {bill.paymentStatus !== 'Paid' && (
            <Button variant="primary" size="sm" onClick={() => handleUpdatePaymentStatus(bill.id, 'Paid')}>Mark Paid</Button>
          )}
          {bill.paymentStatus === 'Paid' && (
            <Button variant="secondary" size="sm" onClick={() => handleUpdatePaymentStatus(bill.id, 'Pending')}>Mark Pending</Button>
          )}
        </div>
      ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading bills...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Billing Management</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      <Card className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Invoice Number"
            value={filterInvoiceNumber}
            onChange={(e) => setFilterInvoiceNumber(e.target.value)}
            placeholder="Search by invoice number"
          />
          <Input
            label="Guest Name"
            value={filterGuestName}
            onChange={(e) => setFilterGuestName(e.target.value)}
            placeholder="Search by guest name"
          />
          <Input
            label="Start Date"
            type="date"
            value={filterDateRange.startDate}
            onChange={(e) => setFilterDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={filterDateRange.endDate}
            onChange={(e) => setFilterDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
          <Select
            label="Payment Status"
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value as Bill['paymentStatus'] | 'All')}
            options={[
              { value: 'All', label: 'All' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Partially Paid', label: 'Partially Paid' },
            ]}
          />
        </div>
      </Card>

      <div className="flex justify-end mb-6">
        {canManageBilling && (
          <Button variant="primary" size="lg" onClick={() => openBillModal()}>
            + Create New Bill
          </Button>
        )}
      </div>

      <Table columns={billColumns} data={filteredBills} emptyMessage="No bills found." />

      {/* Add/Edit Bill Modal */}
      <Modal
        isOpen={isModalOpen && modalType === ModalType.AddEditBill}
        onClose={() => setIsModalOpen(false)}
        title={currentBill ? `Edit Bill: ${currentBill.invoiceNumber}` : 'Create New Bill'}
        size="xl"
      >
        <form onSubmit={handleSaveBill}>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Bill Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Invoice Number"
              name="invoiceNumber"
              value={billForm.invoiceNumber}
              onChange={handleBillFormChange}
              required
            />
            <Input
              label="Bill Date"
              name="billDate"
              type="date"
              value={billForm.billDate}
              onChange={handleBillFormChange}
              required
            />
            <Select
              label="Associated Booking (Optional)"
              name="bookingId"
              value={billForm.bookingId || ''}
              onChange={handleBillFormChange}
              options={[
                { value: '', label: 'None' },
                ...bookings.map(b => ({ value: b.id, label: `Booking ${b.id} (Room ${b.room?.roomNumber})` }))
              ]}
            />
            <Select
              label="Associated Guest (Optional)"
              name="guestId"
              value={billForm.guestId || ''}
              onChange={handleBillFormChange}
              options={[
                { value: '', label: 'None (Walk-in)' },
                ...guests.map(g => ({ value: g.id, label: `${g.name} (${g.phone})` }))
              ]}
            />
            <Input
              label="Room Number (Optional)"
              name="roomNumber"
              value={billForm.roomNumber || ''}
              onChange={handleBillFormChange}
              placeholder="e.g., 101"
            />
            <Input
              label="Discount (₹)"
              name="discount"
              type="number"
              value={billForm.discount}
              onChange={handleBillFormChange}
              min="0"
              step="0.01"
            />
            <Select
              label="Payment Status"
              name="paymentStatus"
              value={billForm.paymentStatus}
              onChange={handleBillFormChange}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Paid', label: 'Paid' },
                { value: 'Partially Paid', label: 'Partially Paid' },
              ]}
              required
            />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Bill Items</h3>
          <div className="space-y-4 mb-6">
            {billItemsForm.length === 0 && <p className="text-lg text-gray-500 dark:text-[#C7C0B0]">No items added to this bill.</p>}
            {billItemsForm.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-gray-50 dark:bg-[#4C769A] rounded-lg">
                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    name="description"
                    value={item.description}
                    onChange={(e) => handleBillItemChange(index, e)}
                    required
                  />
                </div>
                <Input
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleBillItemChange(index, e)}
                  required
                  min="1"
                />
                <Input
                  label="Unit Price (₹)"
                  name="unitPrice"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleBillItemChange(index, e)}
                  required
                  min="0"
                  step="0.01"
                />
                <div>
                  <label className="block text-lg font-medium text-gray-700 dark:text-[#C7C0B0] mb-2">Total (₹)</label>
                  <span className="block w-full px-4 py-3 border border-gray-300 dark:border-[#2A3C4C] rounded-lg shadow-sm bg-gray-100 dark:bg-[#3B5974] text-gray-900 dark:text-[#F5F0E1] text-lg">
                    {item.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <Button type="button" variant="danger" size="icon" onClick={() => handleRemoveBillItem(item.id)}>
                  🗑️
                </Button>
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 bg-blue-50 dark:bg-[#2A3C4C] rounded-lg mt-4">
              <div className="md:col-span-2">
                <Input
                  label="New Item Description"
                  name="description"
                  value={newBillItem.description}
                  onChange={handleNewBillItemChange}
                  placeholder="e.g., Coffee, Extra Towels"
                />
              </div>
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                value={newBillItem.quantity}
                onChange={handleNewBillItemChange}
                min="1"
              />
              <Input
                label="Unit Price (₹)"
                name="unitPrice"
                type="number"
                value={newBillItem.unitPrice}
                onChange={handleNewBillItemChange}
                min="0"
                step="0.01"
              />
              <div>
                <label className="block text-lg font-medium text-gray-700 dark:text-[#C7C0B0] mb-2">Total (₹)</label>
                <span className="block w-full px-4 py-3 border border-gray-300 dark:border-[#2A3C4C] rounded-lg shadow-sm bg-blue-100 dark:bg-[#1F2D3A] text-gray-900 dark:text-[#F5F0E1] text-lg">
                  {newBillItem.total.toLocaleString('en-IN')}
                </span>
              </div>
              <Button type="button" variant="primary" size="icon" onClick={handleAddBillItem}>
                +
              </Button>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Summary</h3>
          <div className="space-y-2 text-xl mb-6">
            <div className="flex justify-between font-medium text-gray-700 dark:text-[#C7C0B0]">
              <span>Subtotal:</span>
              <span>₹{billForm.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700 dark:text-[#C7C0B0]">
              <span>GST Amount:</span>
              <span>₹{billForm.gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-700 dark:text-[#C7C0B0]">
              <span>Discount:</span>
              <span>- ₹${billForm.discount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-2xl text-gray-900 dark:text-[#F5F0E1] border-t border-gray-200 dark:border-[#2A3C4C] pt-3 mt-3">
              <span>Total Amount:</span>
              <span>₹{billForm.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {currentBill ? 'Update Bill' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingManagementPage;

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { BarMenuItem, MenuItemCategory, OrderItem, BarOrder, ModalType } from '../../types';
import { barService } from '../../services/barService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import MenuItemCard from '../../components/bar/MenuItemCard';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store';

const BarPOSPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<BarMenuItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState<MenuItemCategory>(MenuItemCategory.Whiskey);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('Table 1');
  // Fix: Initialize loading state correctly with useState
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(ModalType.None);
  const [splitBillAmount, setSplitBillAmount] = useState(0);
  const [orderToSplit, setOrderToSplit] = useState<BarOrder | null>(null);

  const { user } = useAuthStore();
  const { hasPermission } = useAuth();
  const canManageBarPOS = hasPermission('canManageBarPOS');

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await barService.getMenuItems();
      setMenuItems(items);
    } catch (err: any) {
      setError(`Failed to fetch menu items: ${err.message}`);
      console.error('Fetch menu items error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.category === currentCategory);
  }, [menuItems, currentCategory]);

  const handleAddItemToOrder = (item: BarMenuItem) => {
    const existingItemIndex = currentOrder.findIndex(orderItem => orderItem.menuItemId === item.id);
    if (existingItemIndex > -1) {
      setCurrentOrder(prev => prev.map((orderItem, index) =>
        index === existingItemIndex
          ? { ...orderItem, quantity: orderItem.quantity + 1, total: (orderItem.quantity + 1) * orderItem.price }
          : orderItem
      ));
    } else {
      setCurrentOrder(prev => [...prev, {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        total: item.price,
      }]);
    }
  };

  const handleUpdateOrderItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCurrentOrder(prev => prev.filter(item => item.menuItemId !== menuItemId));
    } else {
      setCurrentOrder(prev => prev.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const calculateOrderSummary = useMemo(() => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
    const gstRate = 0.18; // 18% GST
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount;
    return { subtotal, gstAmount, totalAmount };
  }, [currentOrder]);

  const handlePlaceOrder = async () => {
    if (currentOrder.length === 0) {
      alert('Please add items to the order.');
      return;
    }
    if (!tableNumber) {
      alert('Please enter a table number.');
      return;
    }

    try {
      setError(null);
      const newOrder = await barService.placeOrder(tableNumber, currentOrder);
      alert(`Order placed successfully! Order ID: ${newOrder.id}`);
      setCurrentOrder([]);
      setTableNumber('Table 1'); // Reset
      fetchMenuItems(); // Refresh stock
    } catch (err: any) {
      setError(`Failed to place order: ${err.message}`);
      console.error('Place order error:', err);
    }
  };

  const handlePrintKOT = () => {
    if (currentOrder.length === 0) {
      alert('No items in the current order to print KOT.');
      return;
    }
    // Simulate KOT print
    console.log('Printing KOT:', currentOrder);
    alert('KOT printed successfully!');
  };

  const handleOpenSplitBillModal = (order: BarOrder) => {
    setOrderToSplit(order);
    setSplitBillAmount(0); // Reset
    setModalType(ModalType.SplitBill);
    setIsModalOpen(true);
  };

  const handleConfirmSplitBill = async () => {
    if (!orderToSplit) return;
    if (splitBillAmount <= 0 || splitBillAmount >= orderToSplit.totalAmount) {
      setError('Invalid split amount.');
      return;
    }
    try {
      setError(null);
      await barService.splitBill(orderToSplit.id, splitBillAmount);
      alert('Bill split successfully!');
      setIsModalOpen(false);
      setOrderToSplit(null);
      // In a real app, you would refresh the list of open orders
    } catch (err: any) {
      setError(`Failed to split bill: ${err.message}`);
      console.error('Split bill error:', err);
    }
  };

  const handlePrintBill = () => {
    if (currentOrder.length === 0) {
      alert('No items in the current order to print bill.');
      return;
    }
    // Simulate bill print
    console.log('Printing Bill:', currentOrder, calculateOrderSummary);
    window.print(); // Uses browser print functionality
    alert('Bill printed successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading bar menu...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-4 md:p-0">
      {/* Left Panel: Menu Items */}
      <div className="flex-1 w-full lg:w-2/3 bg-white dark:bg-[#3B5974] rounded-xl shadow-lg p-6 flex flex-col min-h-[calc(100vh-10rem)]">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Bar POS</h1>

        {error && <div className="p-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-lg">{error}</div>}

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-[#2A3C4C] pb-3">
          {Object.values(MenuItemCategory).map(category => (
            <Button
              key={category}
              variant={currentCategory === category ? 'primary' : 'outline'}
              size="md"
              onClick={() => setCurrentCategory(category)}
              className="text-lg"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Item Cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map(item => (
              <MenuItemCard key={item.id} item={item} onAddItem={() => handleAddItemToOrder(item)} />
            ))
          ) : (
            <p className="col-span-full text-center text-lg text-gray-500 dark:text-[#C7C0B0]">No items in this category.</p>
          )}
        </div>
      </div>

      {/* Right Panel: Order Summary & Actions */}
      <div className="flex-1 w-full lg:w-1/3 bg-white dark:bg-[#3B5974] rounded-xl shadow-lg p-6 flex flex-col min-h-[calc(100vh-10rem)] sticky top-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1] mb-4">Order Summary</h2>

        <Input
          label="Table/Room Number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          placeholder="e.g., Table 5 or Room 101"
          className="mb-4 text-lg"
          required
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 border-b border-gray-200 dark:border-[#2A3C4C] pb-4">
          {currentOrder.length === 0 ? (
            <p className="text-lg italic text-gray-500 dark:text-[#C7C0B0]">Order is empty.</p>
          ) : (
            <ul className="space-y-3">
              {currentOrder.map(item => (
                <li key={item.menuItemId} className="flex items-center justify-between text-lg md:text-xl text-gray-800 dark:text-[#F5F0E1]">
                  <span className="flex-grow">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateOrderItemQuantity(item.menuItemId, item.quantity - 1)}
                      className="p-1 text-2xl"
                    >-</Button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateOrderItemQuantity(item.menuItemId, item.quantity + 1)}
                      className="p-1 text-2xl"
                    >+</Button>
                  </div>
                  <span className="w-24 text-right">₹{(item.total).toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-6 text-xl">
          <div className="flex justify-between font-medium text-gray-700 dark:text-[#C7C0B0]">
            <span>Subtotal:</span>
            <span>₹{calculateOrderSummary.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-700 dark:text-[#C7C0B0]">
            <span>GST (18%):</span>
            <span>₹{calculateOrderSummary.gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between font-bold text-2xl text-gray-900 dark:text-[#F5F0E1] border-t border-gray-200 dark:border-[#2A3C4C] pt-3 mt-3">
            <span>Total:</span>
            <span>₹{calculateOrderSummary.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <Button variant="primary" size="lg" onClick={handlePlaceOrder} disabled={!canManageBarPOS || currentOrder.length === 0}>
            Place Order
          </Button>
          <Button variant="secondary" size="lg" onClick={handlePrintKOT} disabled={!canManageBarPOS || currentOrder.length === 0}>
            Print KOT
          </Button>
          <Button variant="secondary" size="lg" onClick={handlePrintBill} disabled={!canManageBarPOS || currentOrder.length === 0}>
            Print Bill
          </Button>
          {/* Example of split bill - in a real app, you'd load open orders to split */}
          {/* <Button variant="secondary" size="lg" onClick={() => handleOpenSplitBillModal(DUMMY_ORDER_TO_SPLIT)}>
            Split Bill
          </Button> */}
        </div>
      </div>

      {/* Split Bill Modal */}
      <Modal
        isOpen={isModalOpen && modalType === ModalType.SplitBill}
        onClose={() => setIsModalOpen(false)}
        title="Split Bill"
        size="sm"
      >
        {orderToSplit && (
          <div className="space-y-4 text-xl">
            <p>Original Total: <span className="font-bold">₹{orderToSplit.totalAmount.toLocaleString('en-IN')}</span></p>
            <Input
              label="Amount for First Bill"
              type="number"
              value={splitBillAmount}
              onChange={(e) => setSplitBillAmount(parseFloat(e.target.value) || 0)}
              required
              min="1"
              max={orderToSplit.totalAmount - 0.01}
            />
            {error && <p className="text-red-600 dark:text-red-400 text-base">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmSplitBill}>Confirm Split</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BarPOSPage;
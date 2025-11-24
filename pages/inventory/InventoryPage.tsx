import React, { useEffect, useState, useCallback } from 'react';
import { InventoryItem, InventoryItemCategory, InventoryTransaction, TransactionType, LiquorBottle, ModalType } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { barService } from '../../services/barService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
// Fix: Imported MenuItemCategory
import { MenuItemCategory } from '../../types';

const InventoryPage: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [liquorBottles, setLiquorBottles] = useState<LiquorBottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'inventory' | 'liquor'>('inventory');

  // Inventory Item Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [currentInventoryItem, setCurrentInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryForm, setInventoryForm] = useState<Omit<InventoryItem, 'id'>>({
    name: '', category: InventoryItemCategory.Food, unit: 'piece', currentStock: 0, minStockLevel: 1, purchasePrice: 0,
  });

  // Liquor Bottle Modal state
  const [isLiquorModalOpen, setIsLiquorModalOpen] = useState(false);
  const [currentLiquorBottle, setCurrentLiquorBottle] = useState<LiquorBottle | null>(null);
  const [liquorForm, setLiquorForm] = useState<Omit<LiquorBottle, 'id'>>({
    name: '', brand: '', totalVolumeMl: 0, currentVolumeMl: 0, pricePerBottle: 0, pegSizeMl: 30, 
    // Fix: Used MenuItemCategory enum value
    category: MenuItemCategory.Whiskey, purchaseDate: '', wastageMl: 0, lowStockThresholdMl: 100,
    // Fix: Added missing properties
    supplierId: '', batchNumber: '', 
  });

  const { user, hasPermission } = useAuth();
  const canManageInventory = hasPermission('canManageInventory');
  const canManageLiquorInventory = hasPermission('canManageLiquorInventory');

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedItems, fetchedLiquorBottles] = await Promise.all([
        inventoryService.getInventoryItems(),
        barService.getLiquorBottles(),
      ]);
      setInventoryItems(fetchedItems);
      setLiquorBottles(fetchedLiquorBottles);
    } catch (err: any) {
      setError(`Failed to fetch inventory data: ${err.message}`);
      console.error('Inventory data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // --- Inventory Item Handlers ---
  const handleInventoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setInventoryForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const openInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setCurrentInventoryItem(item);
      setInventoryForm({ ...item });
    } else {
      setCurrentInventoryItem(null);
      setInventoryForm({ name: '', category: InventoryItemCategory.Food, unit: 'piece', currentStock: 0, minStockLevel: 1, purchasePrice: 0 });
    }
    setIsInventoryModalOpen(true);
  };

  const saveInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentInventoryItem) {
        await inventoryService.updateInventoryItem({ ...inventoryForm, id: currentInventoryItem.id } as InventoryItem);
        alert('Inventory item updated successfully!');
      } else {
        await inventoryService.addInventoryItem(inventoryForm);
        alert('Inventory item added successfully!');
      }
      fetchInventoryData();
      setIsInventoryModalOpen(false);
    } catch (err: any) {
      setError(`Failed to save item: ${err.message}`);
      console.error('Save inventory item error:', err);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await inventoryService.deleteInventoryItem(itemId);
      alert('Inventory item deleted successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setError(`Failed to delete item: ${err.message}`);
      console.error('Delete inventory item error:', err);
    }
  };

  const recordStockAdjustment = async (itemId: string, type: TransactionType.StockIn | TransactionType.StockOut | TransactionType.Adjustment | TransactionType.Wastage, quantity: number, notes?: string) => {
    if (!user) {
      setError('User not authenticated for stock adjustment.');
      return;
    }
    try {
      await inventoryService.recordTransaction(itemId, type, quantity, user.id, notes);
      alert('Stock adjustment recorded successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setError(`Failed to record adjustment: ${err.message}`);
      console.error('Stock adjustment error:', err);
    }
  };

  // --- Liquor Bottle Handlers ---
  const handleLiquorFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setLiquorForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const openLiquorModal = (bottle?: LiquorBottle) => {
    if (bottle) {
      setCurrentLiquorBottle(bottle);
      setLiquorForm({ ...bottle });
    } else {
      setCurrentLiquorBottle(null);
      // Fix: Used MenuItemCategory enum value and added missing properties
      setLiquorForm({ 
        name: '', brand: '', totalVolumeMl: 0, currentVolumeMl: 0, pricePerBottle: 0, pegSizeMl: 30, 
        category: MenuItemCategory.Whiskey, purchaseDate: new Date().toISOString().split('T')[0], wastageMl: 0, 
        lowStockThresholdMl: 100, supplierId: '', batchNumber: '' 
      });
    }
    setIsLiquorModalOpen(true);
  };

  const saveLiquorBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentLiquorBottle) {
        await barService.updateLiquorBottle({ ...liquorForm, id: currentLiquorBottle.id } as LiquorBottle);
        alert('Liquor bottle updated successfully!');
      } else {
        await barService.addLiquorBottle(liquorForm);
        alert('Liquor bottle added successfully!');
      }
      fetchInventoryData();
      setIsLiquorModalOpen(false);
    } catch (err: any) {
      setError(`Failed to save liquor bottle: ${err.message}`);
      console.error('Save liquor bottle error:', err);
    }
  };

  const deleteLiquorBottle = async (bottleId: string) => {
    if (!window.confirm('Are you sure you want to delete this liquor bottle entry?')) return;
    try {
      // Fix: Changed from inventoryService to barService
      await barService.deleteLiquorBottle(bottleId); 
      alert('Liquor bottle deleted successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setError(`Failed to delete liquor bottle: ${err.message}`);
      console.error('Delete liquor bottle error:', err);
    }
  };

  const recordLiquorWastage = async (bottleId: string, wastageMl: number) => {
    if (!user) {
      setError('User not authenticated for wastage recording.');
      return;
    }
    try {
      await barService.recordWastage(bottleId, wastageMl);
      alert('Liquor wastage recorded successfully!');
      fetchInventoryData();
    } catch (err: any) {
      setError(`Failed to record wastage: ${err.message}`);
      console.error('Record liquor wastage error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading inventory...
      </div>
    );
  }

  const inventoryColumns = [
    { key: 'name', header: 'Item Name', className: 'font-semibold' },
    { key: 'category', header: 'Category' },
    { key: 'currentStock', header: 'Stock', render: (item: InventoryItem) => `${item.currentStock} ${item.unit}` },
    { key: 'minStockLevel', header: 'Min Stock' },
    { key: 'expiryDate', header: 'Expiry Date', render: (item: InventoryItem) => item.expiryDate || 'N/A' },
    {
      key: 'status',
      header: 'Status',
      render: (item: InventoryItem) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.currentStock <= item.minStockLevel ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'}`}>
          {item.currentStock <= item.minStockLevel ? 'Low' : 'OK'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: InventoryItem) => canManageInventory ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openInventoryModal(item)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => deleteInventoryItem(item.id)}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => recordStockAdjustment(item.id, TransactionType.StockOut, 1, 'Manual adjustment')}>Out</Button>
        </div>
      ) : null,
    },
  ];

  const liquorColumns = [
    { key: 'name', header: 'Bottle Name', className: 'font-semibold' },
    { key: 'brand', header: 'Brand' },
    { key: 'category', header: 'Category' },
    { key: 'totalVolumeMl', header: 'Total (ml)' },
    { key: 'currentVolumeMl', header: 'Current (ml)', render: (bottle: LiquorBottle) => `${bottle.currentVolumeMl.toFixed(0)} ml` },
    { key: 'pegSizeMl', header: 'Peg Size (ml)' },
    { key: 'wastageMl', header: 'Wastage (ml)' },
    {
      key: 'status',
      header: 'Status',
      render: (bottle: LiquorBottle) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bottle.currentVolumeMl <= bottle.lowStockThresholdMl ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'}`}>
          {bottle.currentVolumeMl <= bottle.lowStockThresholdMl ? 'Low' : 'OK'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (bottle: LiquorBottle) => canManageLiquorInventory ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openLiquorModal(bottle)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => deleteLiquorBottle(bottle.id)}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => recordLiquorWastage(bottle.id, bottle.pegSizeMl)}>Waste Peg</Button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Inventory Management</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-[#2A3C4C] pb-3">
        <Button variant={currentTab === 'inventory' ? 'primary' : 'secondary'} size="lg" onClick={() => setCurrentTab('inventory')}>
          General Inventory
        </Button>
        <Button variant={currentTab === 'liquor' ? 'primary' : 'secondary'} size="lg" onClick={() => setCurrentTab('liquor')}>
          Liquor Bottles
        </Button>
      </div>

      <div className="flex justify-end mb-6">
        {currentTab === 'inventory' && canManageInventory && (
          <Button variant="primary" size="lg" onClick={() => openInventoryModal()}>
            + Add New Item
          </Button>
        )}
        {currentTab === 'liquor' && canManageLiquorInventory && (
          <Button variant="primary" size="lg" onClick={() => openLiquorModal()}>
            + Add Liquor Bottle
          </Button>
        )}
      </div>

      {currentTab === 'inventory' && (
        <Table columns={inventoryColumns} data={inventoryItems} emptyMessage="No general inventory items found." />
      )}
      {currentTab === 'liquor' && (
        <Table columns={liquorColumns} data={liquorBottles} emptyMessage="No liquor bottles found." />
      )}

      {/* Add/Edit Inventory Item Modal */}
      <Modal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title={currentInventoryItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        size="md"
      >
        <form onSubmit={saveInventoryItem}>
          <Input label="Item Name" name="name" value={inventoryForm.name} onChange={handleInventoryFormChange} required />
          <Select
            label="Category"
            name="category"
            value={inventoryForm.category}
            onChange={handleInventoryFormChange}
            options={Object.values(InventoryItemCategory).map(cat => ({ value: cat, label: cat }))}
            required
          />
          <Input label="Unit (e.g., kg, piece)" name="unit" value={inventoryForm.unit} onChange={handleInventoryFormChange} required />
          <Input label="Current Stock" name="currentStock" type="number" value={inventoryForm.currentStock} onChange={handleInventoryFormChange} required min="0" />
          <Input label="Minimum Stock Level" name="minStockLevel" type="number" value={inventoryForm.minStockLevel} onChange={handleInventoryFormChange} required min="0" />
          <Input label="Purchase Price" name="purchasePrice" type="number" value={inventoryForm.purchasePrice} onChange={handleInventoryFormChange} required min="0" step="0.01" />
          <Input label="Expiry Date (Optional)" name="expiryDate" type="date" value={inventoryForm.expiryDate || ''} onChange={handleInventoryFormChange} />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsInventoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Item</Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Liquor Bottle Modal */}
      <Modal
        isOpen={isLiquorModalOpen}
        onClose={() => setIsLiquorModalOpen(false)}
        title={currentLiquorBottle ? 'Edit Liquor Bottle' : 'Add New Liquor Bottle'}
        size="md"
      >
        <form onSubmit={saveLiquorBottle}>
          <Input label="Bottle Name" name="name" value={liquorForm.name} onChange={handleLiquorFormChange} required />
          <Input label="Brand" name="brand" value={liquorForm.brand} onChange={handleLiquorFormChange} required />
          <Select
            label="Category"
            name="category"
            value={liquorForm.category}
            onChange={handleLiquorFormChange}
            options={[
              // Fix: Used MenuItemCategory enum values
              { value: MenuItemCategory.Whiskey, label: MenuItemCategory.Whiskey },
              { value: MenuItemCategory.Rum, label: MenuItemCategory.Rum },
              { value: MenuItemCategory.Wine, label: MenuItemCategory.Wine },
              { value: MenuItemCategory.Beer, label: MenuItemCategory.Beer },
              { value: MenuItemCategory.Cocktails, label: MenuItemCategory.Cocktails },
              { value: MenuItemCategory.SoftDrinks, label: MenuItemCategory.SoftDrinks },
              { value: MenuItemCategory.Snacks, label: MenuItemCategory.Snacks },
            ]}
            required
          />
          <Input label="Total Volume (ml)" name="totalVolumeMl" type="number" value={liquorForm.totalVolumeMl} onChange={handleLiquorFormChange} required min="0" />
          <Input label="Current Volume (ml)" name="currentVolumeMl" type="number" value={liquorForm.currentVolumeMl} onChange={handleLiquorFormChange} required min="0" max={liquorForm.totalVolumeMl} />
          <Input label="Price per Bottle" name="pricePerBottle" type="number" value={liquorForm.pricePerBottle} onChange={handleLiquorFormChange} required min="0" step="0.01" />
          <Input label="Standard Peg Size (ml)" name="pegSizeMl" type="number" value={liquorForm.pegSizeMl} onChange={handleLiquorFormChange} required min="0" />
          <Input label="Low Stock Threshold (ml)" name="lowStockThresholdMl" type="number" value={liquorForm.lowStockThresholdMl} onChange={handleLiquorFormChange} required min="0" />
          <Input label="Purchase Date" name="purchaseDate" type="date" value={liquorForm.purchaseDate} onChange={handleLiquorFormChange} required />
          <Input label="Expiry Date (Optional)" name="expiryDate" type="date" value={liquorForm.expiryDate || ''} onChange={handleLiquorFormChange} />
          <Input label="Supplier ID" name="supplierId" value={liquorForm.supplierId || ''} onChange={handleLiquorFormChange} required />
          <Input label="Batch Number" name="batchNumber" value={liquorForm.batchNumber || ''} onChange={handleLiquorFormChange} required />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsLiquorModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Bottle</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
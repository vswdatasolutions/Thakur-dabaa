import React, { useEffect, useState, useCallback } from 'react';
import { Vendor, ModalType } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';

const VendorManagementPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVendorForEdit, setCurrentVendorForEdit] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<Omit<Vendor, 'id'>>({
    name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '',
  });

  const { hasPermission } = useAuth();
  const canManageVendors = hasPermission('canManageVendors');

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedVendors = await inventoryService.getVendors();
      setVendors(fetchedVendors);
    } catch (err: any) {
      setError(`Failed to fetch vendors: ${err.message}`);
      console.error('Fetch vendors error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVendorForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const openVendorModal = (vendor?: Vendor) => {
    if (vendor) {
      setCurrentVendorForEdit(vendor);
      setVendorForm({ ...vendor });
    } else {
      setCurrentVendorForEdit(null);
      setVendorForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' });
    }
    setIsModalOpen(true);
  };

  const saveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentVendorForEdit) {
        await inventoryService.updateVendor({ ...vendorForm, id: currentVendorForEdit.id } as Vendor);
        alert('Vendor updated successfully!');
      } else {
        await inventoryService.addVendor(vendorForm);
        alert('Vendor added successfully!');
      }
      fetchVendors();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(`Failed to save vendor: ${err.message}`);
      console.error('Save vendor error:', err);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!canManageVendors) {
      alert('You do not have permission to delete vendors.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await inventoryService.deleteVendor(vendorId);
      alert('Vendor deleted successfully!');
      fetchVendors();
    } catch (err: any) {
      setError(`Failed to delete vendor: ${err.message}`);
      console.error('Delete vendor error:', err);
    }
  };

  const vendorColumns = [
    { key: 'name', header: 'Vendor Name', className: 'font-semibold' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'address', header: 'Address' },
    { key: 'gstNumber', header: 'GST No.', render: (vendor: Vendor) => vendor.gstNumber || 'N/A' },
    {
      key: 'actions',
      header: 'Actions',
      render: (vendor: Vendor) => canManageVendors ? (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openVendorModal(vendor)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => deleteVendor(vendor.id)}>Delete</Button>
        </div>
      ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading vendors...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Vendor Management</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      <div className="flex justify-end mb-6">
        {canManageVendors && (
          <Button variant="primary" size="lg" onClick={() => openVendorModal()}>
            + Add New Vendor
          </Button>
        )}
      </div>

      <Table columns={vendorColumns} data={vendors} emptyMessage="No vendors found." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentVendorForEdit ? 'Edit Vendor' : 'Add New Vendor'}
        size="md"
      >
        <form onSubmit={saveVendor}>
          <Input label="Vendor Name" name="name" value={vendorForm.name} onChange={handleFormChange} required />
          <Input label="Contact Person" name="contactPerson" value={vendorForm.contactPerson} onChange={handleFormChange} required />
          <Input label="Phone" name="phone" value={vendorForm.phone} onChange={handleFormChange} required />
          <Input label="Email" name="email" type="email" value={vendorForm.email} onChange={handleFormChange} required />
          <label htmlFor="address" className="block text-lg font-medium text-gray-700 dark:text-[#C7C0B0] mb-2">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={vendorForm.address}
            onChange={handleFormChange}
            rows={3}
            className="block w-full px-4 py-3 border border-gray-300 dark:border-[#2A3C4C] rounded-lg shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white dark:bg-[#3B5974] text-gray-900 dark:text-[#F5F0E1] placeholder-gray-500 dark:placeholder-[#C7C0B0]
                      text-base md:text-lg mb-4"
            required
          ></textarea>
          <Input label="GST Number (Optional)" name="gstNumber" value={vendorForm.gstNumber || ''} onChange={handleFormChange} />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Vendor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorManagementPage;
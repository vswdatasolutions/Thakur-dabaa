import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomStatus, UserRole, Guest, Booking, ModalType } from '../../types';
import { hotelService } from '../../services/hotelService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import RoomCard from '../../components/hotel/RoomCard';
import RoomDetailDrawer from '../../components/hotel/RoomDetailDrawer';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';

const RoomsManagementPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<RoomStatus | 'All'>('All');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Fix: Initialized loading state with useState and default to false
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalType, setModalType] = useState<ModalType>(ModalType.None);
  const [currentRoomForEdit, setCurrentRoomForEdit] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<Omit<Room, 'id'>>({ roomNumber: '', roomType: 'Standard', price: 0, status: RoomStatus.Vacant, capacity: 1 });

  const { hasPermission } = useAuth();
  const canManageRooms = hasPermission('canManageRooms');

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRooms = await hotelService.getRooms();
      setRooms(fetchedRooms);
    } catch (err: any) {
      setError(`Failed to fetch rooms: ${err.message}`);
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDrawerOpen(true);
  };

  const handleUpdateRoomStatus = useCallback(async (roomId: string, newStatus: RoomStatus) => {
    try {
      await hotelService.updateRoomStatus(roomId, newStatus);
      fetchRooms(); // Re-fetch rooms to update UI
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(prev => prev ? { ...prev, status: newStatus } : null); // Update selected room status
      }
    } catch (err: any) {
      setError(`Failed to update room status: ${err.message}`);
      console.error('Update room status error:', err);
    }
  }, [fetchRooms, selectedRoom]);

  const filteredRooms = filteredStatus === 'All'
    ? rooms
    : rooms.filter(room => room.status === filteredStatus);

  const handleOpenAddRoomModal = () => {
    setRoomForm({ roomNumber: '', roomType: 'Standard', price: 0, status: RoomStatus.Vacant, capacity: 1 });
    setModalType(ModalType.AddEditRoom);
    setCurrentRoomForEdit(null);
  };

  const handleOpenEditRoomModal = (room: Room) => {
    setCurrentRoomForEdit(room);
    setRoomForm({ ...room });
    setModalType(ModalType.AddEditRoom);
  };

  const handleRoomFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setRoomForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (currentRoomForEdit) {
        await hotelService.updateRoom({ ...roomForm, id: currentRoomForEdit.id } as Room);
        alert('Room updated successfully!');
      } else {
        await hotelService.addRoom(roomForm);
        alert('Room added successfully!');
      }
      fetchRooms();
      setModalType(ModalType.None);
    } catch (err: any) {
      setError(`Failed to save room: ${err.message}`);
      console.error('Save room error:', err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await hotelService.deleteRoom(roomId);
      alert('Room deleted successfully!');
      fetchRooms();
      setIsDrawerOpen(false); // Close drawer if the deleted room was open
    } catch (err: any) {
      setError(`Failed to delete room: ${err.message}`);
      console.error('Delete room error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading rooms...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Room Management</h1>

      {error && <div className="p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-xl">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Select
          label="Filter by Status"
          value={filteredStatus}
          onChange={(e) => setFilteredStatus(e.target.value as RoomStatus | 'All')}
          options={[
            { value: 'All', label: 'All' },
            ...Object.values(RoomStatus).map(status => ({ value: status, label: status }))
          ]}
          className="w-full sm:w-auto"
        />
        {canManageRooms && (
          <Button variant="primary" size="lg" onClick={handleOpenAddRoomModal} className="w-full sm:w-auto">
            + Add New Room
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map(room => (
          <RoomCard key={room.id} room={room} onClick={() => handleRoomClick(room)} />
        ))}
      </div>

      {selectedRoom && (
        <RoomDetailDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          room={selectedRoom}
          onUpdateStatus={handleUpdateRoomStatus}
          onEditRoom={canManageRooms ? handleOpenEditRoomModal : undefined}
          onDeleteRoom={canManageRooms ? handleDeleteRoom : undefined}
        />
      )}

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={modalType === ModalType.AddEditRoom}
        onClose={() => setModalType(ModalType.None)}
        title={currentRoomForEdit ? 'Edit Room' : 'Add New Room'}
        size="md"
      >
        <form onSubmit={handleSaveRoom}>
          <Input
            label="Room Number"
            name="roomNumber"
            value={roomForm.roomNumber}
            onChange={handleRoomFormChange}
            placeholder="e.g., 101"
            required
          />
          <Input
            label="Room Type"
            name="roomType"
            value={roomForm.roomType}
            onChange={handleRoomFormChange}
            placeholder="e.g., Standard, Deluxe, Suite"
            required
          />
          <Input
            label="Price per Night"
            name="price"
            type="number"
            value={roomForm.price}
            onChange={handleRoomFormChange}
            required
            min="0"
          />
          <Select
            label="Status"
            name="status"
            value={roomForm.status}
            onChange={handleRoomFormChange}
            options={Object.values(RoomStatus).map(status => ({ value: status, label: status }))}
            required
          />
          <Input
            label="Capacity (Guests)"
            name="capacity"
            type="number"
            value={roomForm.capacity}
            onChange={handleRoomFormChange}
            required
            min="1"
          />
          <Input
            label="Description (Optional)"
            name="description"
            value={roomForm.description || ''}
            onChange={handleRoomFormChange}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setModalType(ModalType.None)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {currentRoomForEdit ? 'Update Room' : 'Add Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsManagementPage;
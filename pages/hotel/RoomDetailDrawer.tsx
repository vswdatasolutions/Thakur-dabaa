import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomStatus, Booking, Guest, BookingStatus } from '../../types';
import Button from '../common/Button';
import { hotelService } from '../../services/hotelService';
import Input from '../common/Input';
import Select from '../common/Select';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface RoomDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onUpdateStatus: (roomId: string, newStatus: RoomStatus) => Promise<void>;
  onEditRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
}

const RoomDetailDrawer: React.FC<RoomDetailDrawerProps> = ({ isOpen, onClose, room, onUpdateStatus, onEditRoom, onDeleteRoom }) => {
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [guestInfo, setGuestInfo] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShifting, setIsShifting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>('');

  const { hasPermission, user } = useAuth();
  const canUpdateRoomStatus = hasPermission('canManageRooms') || (user?.role === UserRole.GeneralStaff);
  const canManageBookings = hasPermission('canManageBookings');
  const canDelete = hasPermission('canManageRooms');

  const fetchRoomDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bookings = await hotelService.getBookings();
      const activeBooking = bookings.find(
        (b) => b.roomId === room.id && (b.status === BookingStatus.CheckedIn || b.status === BookingStatus.Confirmed)
      );
      setCurrentBooking(activeBooking || null);

      if (activeBooking && activeBooking.guestId) {
        const guest = await hotelService.getGuestById(activeBooking.guestId);
        setGuestInfo(guest || null);
      } else {
        setGuestInfo(null);
      }
    } catch (err: any) {
      setError(`Failed to load room details: ${err.message}`);
      console.error('Room details fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  useEffect(() => {
    if (isOpen) {
      fetchRoomDetails();
    } else {
      setIsShifting(false); // Reset shifting state when drawer closes
    }
  }, [isOpen, fetchRoomDetails]);

  const handleCheckIn = async () => {
    if (!currentBooking) {
      alert('No active booking to check-in.');
      return;
    }
    if (currentBooking.status === BookingStatus.CheckedIn) {
      alert('Guest already checked in.');
      return;
    }
    try {
      await hotelService.checkInGuest(currentBooking.id);
      await onUpdateStatus(room.id, RoomStatus.Occupied);
      fetchRoomDetails();
      alert('Guest checked in successfully!');
    } catch (err: any) {
      setError(`Check-in failed: ${err.message}`);
      console.error('Check-in error:', err);
    }
  };

  const handleCheckOut = async () => {
    if (!currentBooking) {
      alert('No active booking to check-out.');
      return;
    }
    if (currentBooking.status !== BookingStatus.CheckedIn) {
      alert('Guest not currently checked in.');
      return;
    }
    if (!window.confirm('Are you sure you want to check out this guest and generate bill?')) return;
    try {
      await hotelService.checkOutGuest(currentBooking.id);
      await onUpdateStatus(room.id, RoomStatus.Cleaning);
      fetchRoomDetails();
      alert('Guest checked out successfully! Bill generated.');
      onClose(); // Close drawer after checkout
    } catch (err: any) {
      setError(`Check-out failed: ${err.message}`);
      console.error('Check-out error:', err);
    }
  };

  const startRoomShift = async () => {
    if (!currentBooking || currentBooking.status !== BookingStatus.CheckedIn) {
      alert('Cannot shift room unless a guest is checked in.');
      return;
    }
    setIsShifting(true);
    try {
      const vacantRooms = await hotelService.getRooms(RoomStatus.Vacant);
      setAvailableRooms(vacantRooms.filter(r => r.id !== room.id));
      if (vacantRooms.length === 0) {
        alert('No vacant rooms available for shifting.');
      }
    } catch (err: any) {
      setError(`Failed to fetch available rooms: ${err.message}`);
      console.error('Fetch available rooms error:', err);
    }
  };

  const confirmRoomShift = async () => {
    if (!selectedNewRoomId) {
      alert('Please select a new room.');
      return;
    }
    if (!currentBooking) return;

    if (!window.confirm(`Are you sure you want to shift guest from Room ${room.roomNumber} to ${availableRooms.find(r => r.id === selectedNewRoomId)?.roomNumber}?`)) return;

    try {
      const oldRoomId = room.id;
      const newRoom = availableRooms.find(r => r.id === selectedNewRoomId);
      if (!newRoom) throw new Error('Selected new room not found');

      // Update the booking with new room ID and update room statuses
      await hotelService.updateBooking({ ...currentBooking, roomId: selectedNewRoomId });

      await onUpdateStatus(oldRoomId, RoomStatus.Cleaning); // Old room to cleaning
      await onUpdateStatus(newRoom.id, RoomStatus.Occupied); // New room to occupied

      alert(`Guest successfully shifted to Room ${newRoom.roomNumber}.`);
      setIsShifting(false);
      onClose(); // Close the drawer
    } catch (err: any) {
      setError(`Room shifting failed: ${err.message}`);
      console.error('Room shift error:', err);
    }
  };

  const isOccupied = room.status === RoomStatus.Occupied;

  return (
    <div
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Overlay */}
      {isOpen && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 dark:bg-opacity-80" onClick={onClose}></div>
      )}

      {/* Drawer Content */}
      <div className="absolute right-0 top-0 h-full w-full md:w-3/4 lg:w-1/2 xl:w-1/3 bg-white dark:bg-gray-800 shadow-2xl p-6 md:p-8 flex flex-col overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">Room {room.roomNumber}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            ✖
          </Button>
        </div>

        {error && <div className="p-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg mb-4 text-lg">{error}</div>}

        <div className="flex-grow space-y-6 text-xl text-gray-800 dark:text-gray-200">
          <p><strong>Type:</strong> {room.roomType}</p>
          <p><strong>Price:</strong> ₹{room.price.toLocaleString('en-IN')}</p>
          <p><strong>Capacity:</strong> {room.capacity} Guests</p>
          <p><strong>Status:</strong> <span className={`font-semibold ${room.status === RoomStatus.Vacant ? 'text-green-600' : room.status === RoomStatus.Occupied ? 'text-red-600' : 'text-yellow-600'}`}>{room.status}</span></p>
          {room.description && <p><strong>Description:</strong> {room.description}</p>}

          {loading ? (
            <p className="text-center text-blue-600 dark:text-blue-400 text-xl">Loading booking details...</p>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4 border-t pt-4 border-gray-200 dark:border-gray-700">Current Booking Details</h3>
              {currentBooking ? (
                <div className="space-y-4">
                  <p><strong>Booking ID:</strong> {currentBooking.id}</p>
                  <p><strong>Check-in:</strong> {currentBooking.checkInDate}</p>
                  <p><strong>Check-out:</strong> {currentBooking.checkOutDate}</p>
                  <p><strong>Booking Status:</strong> <span className="font-semibold">{currentBooking.status}</span></p>
                  <p><strong>Total Amount:</strong> ₹{currentBooking.totalAmount.toLocaleString('en-IN')}</p>

                  {guestInfo && (
                    <>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 border-t pt-3 border-gray-200 dark:border-gray-700">Guest Information</h4>
                      <p><strong>Name:</strong> {guestInfo.name}</p>
                      <p><strong>Email:</strong> {guestInfo.email}</p>
                      <p><strong>Phone:</strong> {guestInfo.phone}</p>
                      <p><strong>Address:</strong> {guestInfo.address}</p>
                      {guestInfo.kycDocumentUrl && (
                        <div>
                          <strong>KYC Document:</strong>{' '}
                          <a
                            href={guestInfo.kycDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View Document
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-lg italic text-gray-600 dark:text-gray-400">No active booking for this room.</p>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
          {canManageBookings && !isOccupied && currentBooking && currentBooking.status === BookingStatus.Confirmed && (
             <Button variant="primary" size="lg" onClick={handleCheckIn}>Check-In Guest</Button>
          )}

          {canManageBookings && isOccupied && (currentBooking?.status === BookingStatus.CheckedIn) && (
            <>
              <Button variant="danger" size="lg" onClick={handleCheckOut}>Check-Out Guest & Bill</Button>
              {!isShifting ? (
                <Button variant="secondary" size="lg" onClick={startRoomShift}>Shift Room</Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Select
                    label="Select New Room"
                    options={availableRooms.map(r => ({ value: r.id, label: `Room ${r.roomNumber} (${r.roomType})` }))}
                    value={selectedNewRoomId}
                    onChange={(e) => setSelectedNewRoomId(e.target.value)}
                    required
                  />
                  <div className="flex gap-3">
                    <Button variant="secondary" size="md" onClick={() => setIsShifting(false)}>Cancel Shift</Button>
                    <Button variant="primary" size="md" onClick={confirmRoomShift}>Confirm Shift</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {canUpdateRoomStatus && room.status !== RoomStatus.Vacant && (
            <Button variant="secondary" size="lg" onClick={() => onUpdateStatus(room.id, RoomStatus.Vacant)}>Mark Vacant</Button>
          )}
          {canUpdateRoomStatus && room.status !== RoomStatus.Cleaning && (
            <Button variant="secondary" size="lg" onClick={() => onUpdateStatus(room.id, RoomStatus.Cleaning)}>Mark Cleaning</Button>
          )}
          {canUpdateRoomStatus && room.status !== RoomStatus.Maintenance && (
            <Button variant="secondary" size="lg" onClick={() => onUpdateStatus(room.id, RoomStatus.Maintenance)}>Mark Maintenance</Button>
          )}

          <div className="flex justify-end gap-3 mt-4">
            {onEditRoom && hasPermission('canManageRooms') && (
              <Button variant="secondary" size="md" onClick={() => onEditRoom(room)}>Edit Room</Button>
            )}
            {onDeleteRoom && canDelete && (
              <Button variant="danger" size="md" onClick={() => onDeleteRoom(room.id)}>Delete Room</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailDrawer;
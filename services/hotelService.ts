import { Room, RoomStatus, Booking, Guest, BookingStatus, Bill, BillItem, User } from '../types';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_BOOKINGS, MOCK_BILLS } from '../constants';

const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

let roomsData: Room[] = [...MOCK_ROOMS];
let guestsData: Guest[] = [...MOCK_GUESTS];
let bookingsData: Booking[] = [...MOCK_BOOKINGS];
// Fix: Initialize billsData directly from MOCK_BILLS as it's now strongly typed in constants.ts
let billsData: Bill[] = [...MOCK_BILLS];

export const hotelService = {
  // --- Rooms ---
  getRooms: async (status?: RoomStatus): Promise<Room[]> => {
    await simulateNetworkDelay();
    return status ? roomsData.filter(room => room.status === status) : roomsData;
  },

  getRoomById: async (id: string): Promise<Room | undefined> => {
    await simulateNetworkDelay();
    return roomsData.find(room => room.id === id);
  },

  updateRoomStatus: async (id: string, newStatus: RoomStatus): Promise<Room> => {
    await simulateNetworkDelay();
    const roomIndex = roomsData.findIndex(room => room.id === id);
    if (roomIndex > -1) {
      roomsData[roomIndex] = { ...roomsData[roomIndex], status: newStatus };
      return roomsData[roomIndex];
    }
    throw new Error('Room not found');
  },

  addRoom: async (room: Omit<Room, 'id'>): Promise<Room> => {
    await simulateNetworkDelay();
    const newRoom = { id: `room-${Date.now()}`, ...room };
    roomsData.push(newRoom);
    return newRoom;
  },

  updateRoom: async (room: Room): Promise<Room> => {
    await simulateNetworkDelay();
    const index = roomsData.findIndex(r => r.id === room.id);
    if (index === -1) throw new Error('Room not found');
    roomsData[index] = room;
    return room;
  },

  deleteRoom: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    roomsData = roomsData.filter(r => r.id !== id);
  },

  // --- Guests ---
  getGuests: async (): Promise<Guest[]> => {
    await simulateNetworkDelay();
    return guestsData;
  },

  getGuestById: async (id: string): Promise<Guest | undefined> => {
    await simulateNetworkDelay();
    return guestsData.find(guest => guest.id === id);
  },

  addGuest: async (guest: Omit<Guest, 'id'>): Promise<Guest> => {
    await simulateNetworkDelay();
    const newGuest = { id: `gst-${Date.now()}`, ...guest };
    guestsData.push(newGuest);
    return newGuest;
  },

  updateGuest: async (guest: Guest): Promise<Guest> => {
    await simulateNetworkDelay();
    const index = guestsData.findIndex(g => g.id === guest.id);
    if (index === -1) throw new Error('Guest not found');
    guestsData[index] = guest;
    return guest;
  },

  // --- Bookings ---
  getBookings: async (): Promise<Booking[]> => {
    await simulateNetworkDelay();
    // Enhance bookings with room and guest details for display
    return bookingsData.map(booking => {
      const room = roomsData.find(r => r.id === booking.roomId);
      const guest = guestsData.find(g => g.id === booking.guestId);
      return { ...booking, room, guest };
    });
  },

  getBookingById: async (id: string): Promise<Booking | undefined> => {
    await simulateNetworkDelay();
    const booking = bookingsData.find(b => b.id === id);
    if (booking) {
      const room = roomsData.find(r => r.id === booking.roomId);
      const guest = guestsData.find(g => g.id === booking.guestId);
      return { ...booking, room, guest };
    }
    return undefined;
  },

  addBooking: async (booking: Omit<Booking, 'id' | 'room' | 'guest'>, newGuestData?: Omit<Guest, 'id'>): Promise<Booking> => {
    await simulateNetworkDelay();
    let guestId = booking.guestId;

    if (newGuestData) {
      const newGuest = await hotelService.addGuest(newGuestData);
      guestId = newGuest.id;
    }

    const newBooking: Booking = { id: `bkg-${Date.now()}`, ...booking, guestId, status: BookingStatus.Pending };
    bookingsData.push(newBooking);

    // Update room status if checking in immediately
    const room = roomsData.find(r => r.id === newBooking.roomId);
    if (room && newBooking.status === BookingStatus.CheckedIn) {
      await hotelService.updateRoomStatus(room.id, RoomStatus.Occupied);
    }
    return { ...newBooking, room, guest: guestsData.find(g => g.id === guestId) };
  },

  updateBooking: async (updatedBooking: Booking): Promise<Booking> => {
    await simulateNetworkDelay();
    const index = bookingsData.findIndex(b => b.id === updatedBooking.id);
    if (index === -1) throw new Error('Booking not found');

    const originalBooking = bookingsData[index];
    bookingsData[index] = updatedBooking;

    // Handle room status changes
    if (originalBooking.status !== BookingStatus.CheckedIn && updatedBooking.status === BookingStatus.CheckedIn) {
      await hotelService.updateRoomStatus(updatedBooking.roomId, RoomStatus.Occupied);
    } else if (originalBooking.status === BookingStatus.CheckedIn && updatedBooking.status === BookingStatus.CheckedOut) {
      await hotelService.updateRoomStatus(updatedBooking.roomId, RoomStatus.Cleaning);
    } else if (originalBooking.roomId !== updatedBooking.roomId && updatedBooking.status === BookingStatus.CheckedIn) {
      // Room shifting
      await hotelService.updateRoomStatus(originalBooking.roomId, RoomStatus.Cleaning);
      await hotelService.updateRoomStatus(updatedBooking.roomId, RoomStatus.Occupied);
    }

    const room = roomsData.find(r => r.id === updatedBooking.roomId);
    const guest = guestsData.find(g => g.id === updatedBooking.guestId);
    return { ...updatedBooking, room, guest };
  },

  checkInGuest: async (bookingId: string): Promise<Booking> => {
    const booking = await hotelService.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    return hotelService.updateBooking({ ...booking, status: BookingStatus.CheckedIn });
  },

  checkOutGuest: async (bookingId: string): Promise<Booking> => {
    const booking = await hotelService.getBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');

    // Check if a bill already exists for this booking
    let bill = billsData.find(b => b.bookingId === booking.id);
    if (!bill) {
      // If no bill, generate a new one
      bill = await hotelService.generateBill(booking);
    } else {
      console.log(`Bill ${bill.id} already exists for booking ${booking.id}. Skipping new generation.`);
    }

    const updatedBooking = await hotelService.updateBooking({ ...booking, status: BookingStatus.CheckedOut });
    await hotelService.updateRoomStatus(booking.roomId, RoomStatus.Cleaning);
    
    return updatedBooking;
  },

  // --- Billing ---
  generateBill: async (booking: Booking, additionalItems: BillItem[] = [], discount: number = 0): Promise<Bill> => {
    await simulateNetworkDelay();
    const room = roomsData.find(r => r.id === booking.roomId);
    if (!room) throw new Error('Room not found for billing');

    const duration = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const roomCharges = duration * room.price;

    const items: BillItem[] = [
      {
        id: `bi-room-${Date.now()}`,
        description: `Room ${room.roomNumber} (${booking.checkInDate} to ${booking.checkOutDate})`,
        quantity: duration,
        unitPrice: room.price,
        total: roomCharges,
        category: 'Room',
      },
      ...additionalItems,
    ];

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstRate = 0.18; // 18% GST (example)
    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount - discount;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      bookingId: booking.id,
      guestId: booking.guestId,
      roomNumber: room.roomNumber,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paymentStatus: 'Pending', // Initially pending
      billDate: new Date().toISOString().split('T')[0],
      invoiceNumber: `INV-H-${Date.now().toString().slice(-6)}`,
    };
    billsData.push(newBill);
    return newBill;
  },

  getBills: async (bookingId?: string): Promise<Bill[]> => {
    await simulateNetworkDelay();
    return bookingId ? billsData.filter(bill => bill.bookingId === bookingId) : billsData;
  },

  getBillById: async (id: string): Promise<Bill | undefined> => {
    await simulateNetworkDelay();
    return billsData.find(bill => bill.id === id);
  },

  addBill: async (bill: Omit<Bill, 'id'>): Promise<Bill> => {
    await simulateNetworkDelay();
    const newBill = { id: `bill-${Date.now()}`, ...bill };
    billsData.push(newBill);
    return newBill;
  },

  updateBill: async (updatedBill: Bill): Promise<Bill> => {
    await simulateNetworkDelay();
    const index = billsData.findIndex(bill => bill.id === updatedBill.id);
    if (index === -1) throw new Error('Bill not found');
    billsData[index] = updatedBill;
    return updatedBill;
  },

  deleteBill: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    billsData = billsData.filter(bill => bill.id !== id);
  },

  updateBillPaymentStatus: async (billId: string, status: 'Paid' | 'Pending' | 'Partially Paid'): Promise<Bill> => {
    await simulateNetworkDelay();
    const billIndex = billsData.findIndex(bill => bill.id === billId);
    if (billIndex === -1) throw new Error('Bill not found');
    billsData[billIndex] = { ...billsData[billIndex], paymentStatus: status };
    return billsData[billIndex];
  },
};
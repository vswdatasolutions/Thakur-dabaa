import React from 'react';
import { Room, RoomStatus } from '../../types';

interface RoomCardProps {
  room: Room;
  onClick: (room: Room) => void;
}

const getStatusStyles = (status: RoomStatus) => {
  switch (status) {
    case RoomStatus.Vacant:
      return 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100';
    case RoomStatus.Occupied:
      return 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100';
    case RoomStatus.Cleaning:
      return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
    case RoomStatus.Maintenance:
      return 'bg-gray-200 text-gray-800 dark:bg-[#5C86AA] dark:text-[#1F2D3A]';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-[#4C769A] dark:text-[#1F2D3A]';
  }
};

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const statusStyles = getStatusStyles(room.status);

  return (
    <div
      className="bg-white dark:bg-[#3B5974] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer transform hover:scale-103
                 border border-gray-200 dark:border-[#2A3C4C]"
      onClick={() => onClick(room)}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E1]">Room {room.roomNumber}</h3>
        <span className={`px-4 py-2 rounded-full text-lg font-semibold ${statusStyles}`}>
          {room.status}
        </span>
      </div>
      <p className="text-xl text-gray-700 dark:text-[#C7C0B0] mb-2">
        Type: <span className="font-semibold">{room.roomType}</span>
      </p>
      <p className="text-xl text-gray-700 dark:text-[#C7C0B0] mb-2">
        Capacity: <span className="font-semibold">{room.capacity} Guests</span>
      </p>
      <p className="text-2xl font-bold text-blue-600 dark:text-[#5C86AA]">
        ₹{room.price.toLocaleString('en-IN')} / Night
      </p>
    </div>
  );
};

export default RoomCard;
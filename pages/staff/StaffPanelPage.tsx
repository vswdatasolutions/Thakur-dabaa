import React, { useEffect, useState, useCallback } from 'react';
import { Room, RoomStatus, UserRole } from '../../types';
import { hotelService } from '../../services/hotelService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store';

interface Task {
  id: string;
  roomNumber: string;
  taskType: 'Cleaning' | 'Maintenance';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo: string; // User ID
  notes?: string;
}

const StaffPanelPage: React.FC = () => {
  const [roomsNeedingAttention, setRoomsNeedingAttention] = useState<Room[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { hasPermission } = useAuth();
  const canUpdateRoomStatus = hasPermission('canManageRooms') || (user?.role === UserRole.GeneralStaff);

  // Mock task assignment (in a real app, this would come from a backend)
  const generateMockTasks = useCallback((rooms: Room[], staffId: string): Task[] => {
    return rooms.filter(r => r.status === RoomStatus.Cleaning || r.status === RoomStatus.Maintenance)
      .map(r => ({
        id: `task-${r.id}`,
        roomNumber: r.roomNumber,
        taskType: r.status === RoomStatus.Cleaning ? 'Cleaning' : 'Maintenance',
        status: 'Pending', // Default to pending
        assignedTo: staffId,
        notes: r.status === RoomStatus.Cleaning ? 'Full cleaning required' : 'Check for leaky faucet',
      }));
  }, []);

  const fetchStaffPanelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allRooms = await hotelService.getRooms();
      const needsAttention = allRooms.filter(room =>
        room.status === RoomStatus.Cleaning || room.status === RoomStatus.Maintenance
      );
      setRoomsNeedingAttention(needsAttention);

      if (user) {
        // Assign mock tasks for rooms that need attention to the current user
        setActiveTasks(generateMockTasks(needsAttention, user.id));
      }

    } catch (err: any) {
      setError(`Failed to fetch staff panel data: ${err.message}`);
      console.error('Staff panel data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, generateMockTasks]);

  useEffect(() => {
    if (user) {
      fetchStaffPanelData();
    }
  }, [user, fetchStaffPanelData]);

  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: 'In Progress' | 'Completed', roomNumber: string) => {
    setActiveTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    if (newStatus === 'Completed') {
      // Find the room and update its status
      const room = roomsNeedingAttention.find(r => r.roomNumber === roomNumber);
      if (room && canUpdateRoomStatus) {
        try {
          await hotelService.updateRoomStatus(room.id, RoomStatus.Vacant); // Mark as vacant after cleaning/maintenance
          alert(`Room ${room.roomNumber} status updated to Vacant.`);
          fetchStaffPanelData(); // Re-fetch to clear completed task
        } catch (err: any) {
          setError(`Failed to update room status: ${err.message}`);
          console.error('Staff update room status error:', err);
        }
      } else if (!canUpdateRoomStatus) {
        alert('You do not have permission to update room status.');
      }
    }
  }, [roomsNeedingAttention, canUpdateRoomStatus, fetchStaffPanelData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600 dark:text-blue-400 text-xl">
        Loading staff panel...
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

  return (
    <div className="p-4 md:p-0">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-[#F5F0E1] mb-6">Staff Panel</h1>

      <p className="text-2xl text-gray-800 dark:text-[#F5F0E1] mb-8">
        Hello, <span className="font-bold">{user?.username}</span>! Here are your assigned tasks.
      </p>

      {/* Active Tasks */}
      <Card title="Your Active Tasks" className="mb-6">
        {activeTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTasks.map(task => (
              <div key={task.id} className="bg-gray-50 dark:bg-[#4C769A] p-5 rounded-lg shadow-sm border border-gray-200 dark:border-[#2A3C4C]">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-[#F5F0E1] mb-2">Room {task.roomNumber} - {task.taskType}</h3>
                <p className="text-lg text-gray-700 dark:text-[#C7C0B0] mb-3">{task.notes}</p>
                <p className="text-lg font-medium text-blue-600 dark:text-[#F5F0E1] mb-4">Status: {task.status}</p>
                <div className="flex gap-3">
                  {task.status === 'Pending' && (
                    <Button variant="primary" size="md" onClick={() => handleUpdateTaskStatus(task.id, 'In Progress', task.roomNumber)}>
                      Start Task
                    </Button>
                  )}
                  {task.status === 'In Progress' && (
                    <Button variant="primary" size="md" onClick={() => handleUpdateTaskStatus(task.id, 'Completed', task.roomNumber)}>
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xl italic text-gray-600 dark:text-[#C7C0B0]">No tasks currently assigned to you. Enjoy your break!</p>
        )}
      </Card>

      {/* Overview of Rooms Needing Attention (for Managers/Admins as well) */}
      <Card title="Overview: Rooms Needing Attention">
        {roomsNeedingAttention.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomsNeedingAttention.map(room => (
              <div key={room.id} className="bg-yellow-50 dark:bg-yellow-900 p-5 rounded-lg shadow-sm border border-yellow-300 dark:border-yellow-700">
                <h3 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Room {room.roomNumber}</h3>
                <p className="text-xl text-yellow-700 dark:text-yellow-300">Status: <span className="font-bold">{room.status}</span></p>
                <p className="text-lg text-yellow-700 dark:text-yellow-300 mt-1">Type: {room.roomType}</p>
                {canUpdateRoomStatus && (
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => handleUpdateTaskStatus(`task-${room.id}`, 'Completed', room.roomNumber)}>
                    Mark {room.status === RoomStatus.Cleaning ? 'Cleaned' : 'Fixed'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xl italic text-gray-600 dark:text-[#C7C0B0]">All rooms are in good shape!</p>
        )}
      </Card>
    </div>
  );
};

export default StaffPanelPage;
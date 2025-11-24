
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

let usersData: User[] = [...MOCK_USERS]; // Use a mutable copy of mock users

export const userService = {
  getUsers: async (): Promise<User[]> => {
    await simulateNetworkDelay();
    // In a real app, you might not expose tokens
    return usersData.map(user => ({ ...user, token: '' })); // Remove token for display purposes
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    await simulateNetworkDelay();
    const user = usersData.find(u => u.id === id);
    return user ? { ...user, token: '' } : undefined; // Remove token
  },

  addUser: async (user: Omit<User, 'id' | 'token'>): Promise<User> => {
    await simulateNetworkDelay();
    // Simulate ID generation and a default token for new users
    const newUser: User = { id: `usr-${Date.now()}`, token: `fake-jwt-token-new-${Date.now()}`, ...user };
    usersData.push(newUser);
    return { ...newUser, token: '' }; // Return without token
  },

  updateUser: async (user: Omit<User, 'token'>): Promise<User> => {
    await simulateNetworkDelay();
    const index = usersData.findIndex(u => u.id === user.id);
    if (index === -1) throw new Error('User not found');
    // Preserve existing token if not explicitly updated (which it usually isn't in this context)
    const existingToken = usersData[index].token;
    usersData[index] = { ...user, token: existingToken || `fake-jwt-token-updated-${user.id}` };
    return { ...usersData[index], token: '' }; // Return without token
  },

  deleteUser: async (id: string): Promise<void> => {
    await simulateNetworkDelay();
    usersData = usersData.filter(u => u.id !== id);
  },

  // You might also have specific functions for updating roles, resetting passwords, etc.
  updateUserRole: async (id: string, newRole: UserRole): Promise<User> => {
    await simulateNetworkDelay();
    const index = usersData.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    usersData[index] = { ...usersData[index], role: newRole };
    return { ...usersData[index], token: '' }; // Return without token
  },
};

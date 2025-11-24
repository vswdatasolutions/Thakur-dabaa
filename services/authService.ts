
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

// Simulated API calls for authentication
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    await simulateNetworkDelay(); // Simulate API call delay

    // In a real application, you would hash passwords and securely compare.
    // Here, we're using a simple lookup with a placeholder password.
    const user = MOCK_USERS.find(u => u.username === username);

    if (user && password === 'password') { // Assuming a default password for mock users
      // In a real scenario, the backend would return a JWT token
      return { ...user, token: `fake-jwt-token-${user.id}` };
    } else {
      throw new Error('Invalid username or password');
    }
  },

  logout: async (): Promise<void> => {
    await simulateNetworkDelay(); // Simulate API call delay
    // In a real application, this might invalidate a server-side session or refresh token.
    console.log('User logged out (simulated)');
    return Promise.resolve();
  },

  // In a real app, you might have functions to fetch user profile, refresh token, etc.
  getProfile: async (token: string): Promise<User | null> => {
    await simulateNetworkDelay();
    // Simulate fetching user from token
    const userId = token.split('-')[2]; // Extract user ID from fake token
    const user = MOCK_USERS.find(u => u.id === `usr-${userId}`);
    if (user) {
      return { ...user, token };
    }
    return null;
  }
};

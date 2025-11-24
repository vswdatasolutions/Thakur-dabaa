import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-72 z-30 bg-white dark:bg-[#3B5974] shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden text-gray-700 dark:text-[#C7C0B0]">
          ☰
        </Button>
        <span className="hidden lg:block text-2xl font-bold text-gray-800 dark:text-[#F5F0E1] ml-4">
          Welcome, {user?.username} ({user?.role})
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Notifications (Placeholder) */}
        <Button variant="ghost" size="icon" className="text-gray-700 dark:text-[#C7C0B0]">
          🔔
          {/* <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500"></span> */}
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-700 dark:text-[#C7C0B0]">
          {theme === 'light' ? '☀️' : '🌙'}
        </Button>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-2">
          <img
            src="https://picsum.photos/40/40"
            alt="User Avatar"
            className="w-10 h-10 rounded-full border-2 border-blue-500"
          />
          <span className="hidden md:block text-lg font-medium text-gray-800 dark:text-[#F5F0E1]">
            {user?.username}
          </span>
          <Button variant="danger" size="md" onClick={handleLogout} className="ml-2">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
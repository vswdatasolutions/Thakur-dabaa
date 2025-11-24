import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (!user) return false; // Not authenticated, no nav items
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Overlay for mobile/tablet when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 md:w-72 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-[#1F2D3A] dark:to-[#3B5974] text-white z-50
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out
          flex flex-col shadow-lg lg:shadow-none`}
      >
        <div className="p-6 text-center text-3xl font-extrabold border-b border-blue-700 dark:border-[#2A3C4C] sticky top-0 bg-blue-600 dark:bg-[#1F2D3A] z-10">
          HotelNest
        </div>
        <nav className="flex-1 overflow-y-auto custom-scrollbar pt-4">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 py-4 px-6 text-xl font-semibold rounded-lg mx-4 mb-2
                    transition-all duration-200
                    ${isActive
                      ? 'bg-blue-800 dark:bg-[#5C86AA] text-white shadow-md dark:text-[#1F2D3A]'
                      : 'hover:bg-blue-700 dark:hover:bg-[#4C769A] hover:text-white dark:text-[#F5F0E1]'
                    }`
                  }
                  onClick={onClose} // Close sidebar on nav item click for mobile/tablet
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Placeholder for branding/footer */}
        <div className="p-4 text-center text-sm text-blue-200 dark:text-[#C7C0B0] border-t border-blue-700 dark:border-[#2A3C4C] mt-auto">
          &copy; 2024 HotelNest. All rights reserved.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
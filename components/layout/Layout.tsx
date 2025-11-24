import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#1F2D3A] text-gray-900 dark:text-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300 ease-in-out">
        <Navbar onMenuToggle={toggleSidebar} />
        <main className="flex-1 p-4 md:p-8 mt-20 overflow-y-auto">
          <Outlet /> {/* Renders the current route's component */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
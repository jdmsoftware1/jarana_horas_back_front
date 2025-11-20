import React, { useState } from 'react';
import SidebarMenu from './SidebarMenu';

const Layout = ({ children, isAdmin = false, showSidebar = true }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-light">
      {showSidebar && <SidebarMenu isAdmin={isAdmin} />}
      
      <div 
        className={`transition-all duration-300 ${
          showSidebar ? (isSidebarCollapsed ? 'ml-20' : 'ml-64') : 'ml-0'
        }`}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

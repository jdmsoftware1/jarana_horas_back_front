import React from 'react';
import SidebarMenu from './SidebarMenu';

const Layout = ({ children, isAdmin = false, showSidebar = true, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-neutral-light">
      {showSidebar && (
        <SidebarMenu 
          isAdmin={isAdmin} 
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
      
      <div className={`transition-all duration-300 ${showSidebar ? 'ml-64' : 'ml-0'}`}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

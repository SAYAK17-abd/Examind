import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppNavbar } from '../components/layout/AppNavbar';
import { AppSidebar } from '../components/layout/AppSidebar';

export const StudentLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar onMenuToggle={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1">
        <AppSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

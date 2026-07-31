import React from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-red-500/30">
      <Sidebar />
      {/* Main Content Area: Offset by sidebar on desktop, padding for bottom nav on mobile */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { Sidebar, navItems } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';
import InventoryView from '../../views/InventoryView';
import PlaceholderView from '../../views/PlaceholderView';

interface LayoutShellProps {
  currentPath: string;
}

export function LayoutShell({ currentPath }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notice, setNotice } = useAuth();

  const activeNavItem = navItems.find((item) => item.path === currentPath) || navItems[0];
  const currentTitle = activeNavItem.label;

  // Determine which view to render
  const renderContent = () => {
    if (currentPath === '#/inventory' || currentPath === '') {
      return <InventoryView />;
    }
    return <PlaceholderView title={currentTitle} />;
  };

  return (
    <div className="min-h-screen flex bg-amber-50/20 text-stone-900">
      <Sidebar
        currentPath={currentPath}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentTitle={currentTitle}
        />

        {notice && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 text-amber-900 text-sm flex items-center justify-between" role="alert">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-medium text-xs px-2 py-1 rounded hover:bg-amber-200/60"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

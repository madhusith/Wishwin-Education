import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useAuth } from '../hooks/useAuth';

export default function DashboardLayout({
  children,
  showBanner = true,
  classId,
  className = '',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex w-full min-w-0">
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <main className={`flex-1 min-w-0 w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 ${className}`}>
          {/* Always-visible active Announcement Banner */}
          {showBanner && (
            <AnnouncementBanner
              userRole={user?.role}
              classId={classId}
            />
          )}

          {/* Page Body */}
          {children}
        </main>
      </div>
    </div>
  );
}

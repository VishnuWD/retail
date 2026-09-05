import { headers } from 'next/headers';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({ children }) {
  const headersList = await headers();
  const userName = headersList.get('x-user-name') || 'Ramesh';
  const userRole = headersList.get('x-user-role') || 'OWNER';
  
  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar - Hidden on mobile, shown on md screens up */}
      <Sidebar userRole={userRole} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Header containing search, notifications and mobile menu */}
        <Header userName={userName} userRole={userRole} />
        
        {/* Scrollable Page Wrapper with mobile bottom bar clearance */}
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6 md:pb-6 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

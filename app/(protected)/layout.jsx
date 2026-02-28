'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { BrandedLoader } from '../../components/shared/LoadingSpinner';
import Sidebar from '../../components/shared/Sidebar';
import TopHeader from '../../components/shared/TopHeader';
import AppLayout from '../../components/shared/Layout';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <BrandedLoader />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar
        user={user}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      <TopHeader
        user={user}
        onLogout={logout}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <AppLayout hasSidebar={true} isSidebarCollapsed={isSidebarCollapsed}>
        {children}
      </AppLayout>
    </div>
  );
}

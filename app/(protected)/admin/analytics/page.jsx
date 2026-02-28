'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import Analytics from '../../../../components/admin/Analytics';

export default function AnalyticsPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <Analytics user={user} token={getToken()} />;
}

'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import Reports from '../../../../components/admin/Reports';

export default function ReportsPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <Reports user={user} token={getToken()} />;
}

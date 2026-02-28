'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import UserManagement from '../../../../components/admin/UserManagement';

export default function UsersPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <UserManagement user={user} token={getToken()} />;
}

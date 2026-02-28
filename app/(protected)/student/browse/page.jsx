'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import BrowseStudents from '../../../../components/student/BrowseStudents';

export default function BrowseStudentsPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <BrowseStudents user={user} token={getToken()} />;
}

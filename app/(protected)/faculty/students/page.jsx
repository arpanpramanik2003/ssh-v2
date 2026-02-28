'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import StudentList from '../../../../components/faculty/StudentList';

export default function StudentListPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <StudentList user={user} token={getToken()} />;
}

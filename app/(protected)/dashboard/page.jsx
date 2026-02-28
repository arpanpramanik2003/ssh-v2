'use client';
import { useAuth } from '../../../contexts/AuthContext';
import { USER_ROLES } from '../../../utils/constants';
import StudentDashboard from '../../../components/student/Dashboard';
import FacultyDashboard from '../../../components/faculty/Dashboard';
import AdminDashboard from '../../../components/admin/Dashboard';

export default function DashboardPage() {
  const { user, getToken } = useAuth();

  if (!user) return null;

  if (user.role === USER_ROLES.STUDENT) {
    return <StudentDashboard user={user} token={getToken()} />;
  }
  if (user.role === USER_ROLES.FACULTY) {
    return <FacultyDashboard user={user} token={getToken()} />;
  }
  if (user.role === USER_ROLES.ADMIN) {
    return <AdminDashboard user={user} token={getToken()} />;
  }

  return null;
}

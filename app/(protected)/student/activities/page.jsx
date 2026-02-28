'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import ActivityList from '../../../../components/student/ActivityList';

export default function ActivitiesPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <ActivityList user={user} token={getToken()} />;
}

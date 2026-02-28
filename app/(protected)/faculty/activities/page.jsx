'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import AllActivities from '../../../../components/faculty/AllActivities';

export default function AllActivitiesPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <AllActivities user={user} token={getToken()} />;
}

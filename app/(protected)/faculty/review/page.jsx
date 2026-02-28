'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import ReviewQueue from '../../../../components/faculty/ReviewQueue';

export default function ReviewQueuePage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <ReviewQueue user={user} token={getToken()} />;
}

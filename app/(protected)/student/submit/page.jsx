'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import ActivityForm from '../../../../components/student/ActivityForm';

export default function SubmitActivityPage() {
  const { user, getToken } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <ActivityForm
        user={user}
        token={getToken()}
        onSuccess={() => router.push('/student/activities')}
      />
    </div>
  );
}

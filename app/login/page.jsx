'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginPageUI from '../../components/pages/LoginPageUI';
import { BrandedLoader } from '../../components/shared/LoadingSpinner';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <BrandedLoader />;
  }

  return <LoginPageUI onLogin={login} />;
}

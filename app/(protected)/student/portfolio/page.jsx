'use client';
import { useAuth } from '../../../../contexts/AuthContext';
import Portfolio from '../../../../components/student/Portfolio';

export default function PortfolioPage() {
  const { user, getToken } = useAuth();
  if (!user) return null;
  return <Portfolio user={user} token={getToken()} />;
}

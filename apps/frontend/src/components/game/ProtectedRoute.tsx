import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    const redirect = window.location.pathname;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <>{children}</>;
}

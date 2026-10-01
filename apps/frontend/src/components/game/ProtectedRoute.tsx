import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[#11110F] text-sm text-[#9A958B]">Restoring your session…</div>;
  }
  if (!auth.isAuthenticated) {
    const redirect = window.location.pathname;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <>{children}</>;
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuthStatus, logout as apiLogout } from '../lib/api';

export default function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const verifyUser = async () => {
    try {
      const authUser = await checkAuthStatus();
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
        if (requireAuth) {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
      if (requireAuth) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyUser();

    // Listen for authentication changes
    const handleAuthChange = () => {
      verifyUser();
    };

    window.addEventListener('ecotrack-user-updated', handleAuthChange);
    return () => {
      window.removeEventListener('ecotrack-user-updated', handleAuthChange);
    };
  }, [pathname]);

  const logout = async () => {
    await apiLogout();
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, refetch: verifyUser };
}

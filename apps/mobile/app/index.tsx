import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Loading } from '../src/components/ui/Loading';

export default function IndexScreen(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(owner)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return <Loading message="Initializing M Square..." />;
}

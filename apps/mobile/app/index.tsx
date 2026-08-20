import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Loading } from '../src/components/ui/Loading';

export default function IndexScreen(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Initializing PG.mate..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(owner)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

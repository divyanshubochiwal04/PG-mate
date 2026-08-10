import { useContext } from 'react';
import { AuthContext } from '../auth/auth.context';
import type { AuthContextType } from '../auth/auth.context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

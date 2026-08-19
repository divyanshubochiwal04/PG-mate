import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PropertyDto } from '@m-square/contracts';
import { getPropertiesApi } from '../features/properties/api/properties.api';
import { useAuth } from '../hooks/useAuth';

export interface PropertyContextType {
  selectedPropertyId: string | null;
  selectedProperty: PropertyDto | null;
  setSelectedPropertyId: (id: string | null) => void;
  clearSelectedProperty: () => void;
  properties: PropertyDto[];
  isLoading: boolean;
  refetchProperties: () => void;
}

export const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties', 'context-list'],
    queryFn: async () => {
      const res = await getPropertiesApi({ page: 1, pageSize: 50 });
      return res.items || [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const properties = data || [];

  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedPropertyId(null);
    }
  }, [isAuthenticated]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;

  const clearSelectedProperty = () => {
    setSelectedPropertyId(null);
  };

  return (
    <PropertyContext.Provider
      value={{
        selectedPropertyId,
        selectedProperty,
        setSelectedPropertyId,
        clearSelectedProperty,
        properties,
        isLoading,
        refetchProperties: () => void refetch(),
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export function usePropertyContext(): PropertyContextType {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
}

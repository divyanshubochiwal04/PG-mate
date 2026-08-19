import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPropertyByIdApi, updatePropertyApi } from '@/features/properties/api/properties.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function EditPropertyScreen(): React.JSX.Element {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: property,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyByIdApi(propertyId ?? ''),
    enabled: !!propertyId,
  });

  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setName(property.name);
      setAddressLine1(property.address.addressLine1);
      setAddressLine2(property.address.addressLine2 || '');
      setLocality(property.address.locality);
      setCity(property.address.city);
      setState(property.address.state);
      setPostalCode(property.address.postalCode);
      setStatus(property.status);
    }
  }, [property]);

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updatePropertyApi>[1]) =>
      updatePropertyApi(propertyId ?? '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.back();
    },
    onError: (err: unknown) => {
      setErrorMsg(normalizeApiError(err).message);
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (
      !name.trim() ||
      !addressLine1.trim() ||
      !locality.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim()
    ) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    mutation.mutate({
      name: name.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      status,
    });
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Edit Property" />
        <Loading message="Loading property details..." />
      </Screen>
    );
  }

  if (isError || !property) {
    return (
      <Screen>
        <Header title="Edit Property" />
        <ErrorState
          message={error instanceof Error ? error.message : 'Property not found'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={`Edit ${property.name}`} subtitle={`Code: ${property.code}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput label="Property Name *" value={name} onChangeText={setName} />
          <TextInput label="Address Line 1 *" value={addressLine1} onChangeText={setAddressLine1} />
          <TextInput label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} />
          <TextInput label="Locality *" value={locality} onChangeText={setLocality} />
          <TextInput label="City *" value={city} onChangeText={setCity} />
          <TextInput label="State *" value={state} onChangeText={setState} />
          <TextInput
            label="Postal Code *"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
          />

          {errorMsg ? (
            <Button title={errorMsg} onPress={() => undefined} variant="danger" disabled />
          ) : null}

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.halfBtn}
            />
            <Button
              title="Save Changes"
              onPress={handleSubmit}
              isLoading={mutation.isPending}
              style={styles.halfBtn}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  halfBtn: {
    width: '48%',
  },
});

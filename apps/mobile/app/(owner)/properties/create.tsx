import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPropertyApi } from '@/features/properties/api/properties.api';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import { normalizeApiError } from '@/api/error';
import { spacing } from '@/theme';

export default function CreatePropertyScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createPropertyApi,
    onSuccess: () => {
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
      !code.trim() ||
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
      code: code.trim().toUpperCase(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
    });
  };

  return (
    <Screen>
      <Header title="Add New Property" subtitle="Enter property registration details" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <TextInput
            label="Property Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. PG.mate Residency"
          />
          <TextInput
            label="Property Code *"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. PROP-01"
            autoCapitalize="characters"
          />
          <TextInput
            label="Address Line 1 *"
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Street / Building No."
          />
          <TextInput
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Suite 400 (Optional)"
          />
          <TextInput
            label="Locality *"
            value={locality}
            onChangeText={setLocality}
            placeholder="e.g. Bellandur"
          />
          <TextInput
            label="City *"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Bengaluru"
          />
          <TextInput
            label="State *"
            value={state}
            onChangeText={setState}
            placeholder="e.g. Karnataka"
          />
          <TextInput
            label="Postal Code *"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="e.g. 560103"
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
              title="Save Property"
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

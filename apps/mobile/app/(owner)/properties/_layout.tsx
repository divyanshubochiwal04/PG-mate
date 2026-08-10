import React from 'react';
import { Stack } from 'expo-router';

export default function PropertiesLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[propertyId]/index" />
      <Stack.Screen name="[propertyId]/edit" />
      <Stack.Screen name="[propertyId]/facilities" />
      <Stack.Screen name="[propertyId]/buildings/create" />
      <Stack.Screen name="[propertyId]/buildings/[buildingId]/index" />
      <Stack.Screen name="[propertyId]/buildings/[buildingId]/floors/create" />
      <Stack.Screen name="[propertyId]/buildings/[buildingId]/floors/[floorId]/rooms/index" />
      <Stack.Screen name="[propertyId]/buildings/[buildingId]/floors/[floorId]/rooms/create" />
      <Stack.Screen name="[propertyId]/buildings/[buildingId]/floors/[floorId]/rooms/[roomId]/index" />
    </Stack>
  );
}

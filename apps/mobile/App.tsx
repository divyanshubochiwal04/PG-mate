import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>M Square Mobile</Text>
      <Text style={styles.subtitle}>Hostel & PG Management System</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Milestone 6 Ready</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
});

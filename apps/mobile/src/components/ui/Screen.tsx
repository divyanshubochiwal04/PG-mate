import React from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ViewStyle } from 'react-native';
import { colors } from '../../design-system';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  keyboardOffset?: number;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  keyboardOffset = 0,
  edges = ['top', 'bottom', 'left', 'right'],
}) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <View style={[styles.container, style]}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

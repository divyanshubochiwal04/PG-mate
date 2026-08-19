import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PropertyContextSelector } from './PropertyContextSelector';
import { colors, radius, shadows, spacing, typography } from '../../design-system';
import { useUnreadNotificationCount } from '../../features/notifications/hooks/useNotifications';

export interface GlobalHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showPropertySelector?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  safeTop?: boolean;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  title = 'M Square',
  showBackButton,
  onBack,
  showPropertySelector = true,
  showSearch = true,
  showNotifications = true,
  safeTop = true,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;

  const shouldShowBack = showBackButton !== undefined ? showBackButton : title !== 'M Square';

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(owner)');
    }
  };

  const topPadding = safeTop
    ? Math.max(
        insets.top,
        Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0
      )
    : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding + spacing.xs }]}>
      {/* Top Header Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {shouldShowBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackPress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          {title === 'M Square' && <Text style={styles.brandSub}>PROPERTIES</Text>}
        </View>

        <View style={styles.rightActions}>
          {showSearch && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(owner)/search')}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}

          {showNotifications && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(owner)/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(owner)/settings')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Property Selector Bar */}
      {showPropertySelector && (
        <View style={styles.selectorRow}>
          <PropertyContextSelector />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs + 2,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    gap: spacing.xs,
  },
  brandContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: spacing.xs,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  selectorRow: {
    marginTop: spacing.xs,
  },
});

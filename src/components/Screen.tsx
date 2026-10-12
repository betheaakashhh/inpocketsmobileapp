import React from 'react';
import { RefreshControlProps, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';

/** Plain themed full-screen container. */
export function Screen({ children, edges = ['top', 'bottom'], style }: {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

/** Themed scroll screen with the standard 24 px padding. */
export function ScrollScreen({ children, refreshControl, contentStyle }: {
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ padding: Spacing.lg, paddingBottom: Spacing.xxl }, contentStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export const Gap = ({ h = Spacing.md }: { h?: number }) => <View style={{ height: h }} />;

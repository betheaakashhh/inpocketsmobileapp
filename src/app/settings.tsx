import { Stack } from 'expo-router';
import React from 'react';
import { Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ScrollScreen } from '@/components/Screen';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Divider, Row } from '@/app/home/profile';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const followSystem = mode === 'system';
  const trackColor = { false: colors.border, true: colors.primary };

  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />

      <AppText variant="labelMedium" style={{ marginBottom: Spacing.sm, marginLeft: 4 }}>APPEARANCE</AppText>
      <Card padded={false}>
        <Row
          icon={isDark ? 'dark-mode' : 'light-mode'}
          title="Dark mode"
          subtitle={followSystem ? 'Following your device setting' : isDark ? 'On' : 'Off'}
          right={
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              trackColor={trackColor}
              thumbColor={colors.isDark ? colors.text : '#FFFFFF'}
              accessibilityLabel="Dark mode"
            />
          }
        />
        <Divider />
        <Row
          icon="brightness-auto"
          title="Match device"
          subtitle="Switch automatically with your phone's light/dark setting"
          right={
            <Switch
              value={followSystem}
              onValueChange={(v) => setMode(v ? 'system' : isDark ? 'dark' : 'light')}
              trackColor={trackColor}
              thumbColor={colors.isDark ? colors.text : '#FFFFFF'}
              accessibilityLabel="Match device appearance"
            />
          }
        />
      </Card>

      <View style={{ height: Spacing.lg }} />
      <AppText variant="labelMedium" style={{ marginBottom: Spacing.sm, marginLeft: 4 }}>ABOUT</AppText>
      <Card padded={false}>
        <Row icon="info-outline" title="InPockets" subtitle="Version 0.1.0 · React Native" />
      </Card>
    </ScrollScreen>
  );
}

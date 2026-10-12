import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { Icon, IconName } from '@/components/Icon';
import { Routes } from '@/core/routing/gate';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fonts } from '@/core/theme/typography';

const tab = (name: IconName, focusedName: IconName) =>
  ({ color, focused }: { color: unknown; focused: boolean }) => <Icon name={focused ? focusedName : name} size={24} color={String(color)} />;

export default function HomeTabs() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: Fonts.inter600, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: Fonts.sora600, fontSize: 18, color: colors.text },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: tab('home', 'home') }} />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans', headerTitle: 'Your loans', tabBarIcon: tab('description', 'description'),
          headerRight: () => (
            <Pressable onPress={() => router.push(Routes.loanApply)} hitSlop={12} accessibilityLabel="Apply for a loan" style={{ marginRight: 16 }}>
              <Icon name="add" size={26} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="documents" options={{ title: 'Documents', tabBarIcon: tab('folder', 'folder') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tab('person', 'person') }} />
    </Tabs>
  );
}

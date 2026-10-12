import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { FadeSlideIn } from './FadeSlideIn';
import { Icon } from './Icon';
import { StepProgress } from './StepProgress';

interface Props {
  stepIndex: number; // 0-based
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  totalSteps?: number;
  onBack?: () => void;
}

export function OnboardingScaffold({ stepIndex, title, subtitle, children, footer, totalSteps = 4, onBack }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1, paddingHorizontal: Spacing.lg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back"><Icon name="arrow-back" size={24} color={colors.text} /></Pressable>
          ) : <View style={{ width: 4 }} />}
          <StepProgress totalSteps={totalSteps} currentStep={stepIndex} />
        </View>

        <FadeSlideIn style={{ marginTop: Spacing.lg }}><AppText variant="displayMedium">{title}</AppText></FadeSlideIn>
        <FadeSlideIn delay={60} style={{ marginTop: Spacing.xs }}><AppText variant="bodyMedium">{subtitle}</AppText></FadeSlideIn>

        <ScrollView style={{ flex: 1, marginTop: Spacing.lg }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FadeSlideIn delay={100}>{children}</FadeSlideIn>
        </ScrollView>

        {footer ? <View style={{ marginTop: Spacing.md, marginBottom: Spacing.lg }}>{footer}</View> : <View style={{ height: Spacing.lg }} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

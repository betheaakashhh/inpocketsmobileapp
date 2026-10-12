import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';

export function BottomSheet({ visible, onClose, children, dismissable = true }: {
  visible: boolean; onClose: () => void; children: React.ReactNode; dismissable?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissable ? onClose : undefined} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }} onPress={dismissable ? onClose : undefined}>
          <Animated.View entering={SlideInDown.duration(280)}>
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.bg,
                borderTopLeftRadius: Spacing.radiusLg,
                borderTopRightRadius: Spacing.radiusLg,
                padding: Spacing.lg,
                paddingBottom: insets.bottom + Spacing.lg,
              }}
            >
              <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: Spacing.lg }} />
              {children}
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

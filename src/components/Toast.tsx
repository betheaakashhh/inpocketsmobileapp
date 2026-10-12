import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType }

const Ctx = createContext<{ show: (message: string, type?: ToastType) => void }>({ show: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, message, type });
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const bg = toast?.type === 'success' ? colors.success : toast?.type === 'error' ? '#DC2626' : colors.primary;
  const icon: IconName = toast?.type === 'success' ? 'check-circle' : toast?.type === 'error' ? 'error' : 'info';

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + Spacing.md, paddingHorizontal: Spacing.md }}>
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(180)}
            style={{ backgroundColor: bg, borderRadius: Spacing.radiusMd, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
          >
            <Icon name={icon} size={20} color="#FFFFFF" />
            <AppText variant="bodyMedium" color="#FFFFFF" style={{ flex: 1 }}>{toast.message}</AppText>
          </Animated.View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

import React from 'react';
import { View } from 'react-native';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  const { colors } = useTheme();
  const map = {
    success: [colors.success, colors.successBg],
    warning: [colors.warning, colors.warningBg],
    danger: [colors.danger, colors.dangerBg],
    info: [colors.info, colors.infoBg],
    neutral: [colors.neutral, colors.neutralBg],
  } as const;
  const [fg, bg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Spacing.radiusPill }}>
      <AppText variant="labelMedium" color={fg} style={{ fontFamily: 'Inter_700Bold' }}>{label}</AppText>
    </View>
  );
}

export function LoanStatusChip({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED': return <StatusChip label="Approved" tone="success" />;
    case 'REJECTED': return <StatusChip label="Rejected" tone="danger" />;
    case 'CANCELLED': return <StatusChip label="Cancelled" tone="neutral" />;
    case 'EXPIRED': return <StatusChip label="Expired" tone="neutral" />;
    case 'MANUAL_REVIEW': return <StatusChip label="In review" tone="warning" />;
    case 'PENDING_ADDITIONAL_INFORMATION': return <StatusChip label="Action needed" tone="warning" />;
    case 'PROCESSING': return <StatusChip label="Processing" tone="info" />;
    case 'SUBMITTED': return <StatusChip label="Submitted" tone="info" />;
    case 'DRAFT':
    default: return <StatusChip label="Draft" tone="neutral" />;
  }
}

export function VerificationStatusChip({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED': return <StatusChip label="Verified" tone="success" />;
    case 'FAILED': return <StatusChip label="Failed" tone="danger" />;
    case 'MANUAL_REVIEW': return <StatusChip label="In review" tone="warning" />;
    case 'RETRY_REQUIRED': return <StatusChip label="Retry needed" tone="warning" />;
    case 'PROCESSING': return <StatusChip label="Processing" tone="info" />;
    case 'PENDING': return <StatusChip label="Pending" tone="info" />;
    case 'NOT_STARTED':
    default: return <StatusChip label="Not started" tone="neutral" />;
  }
}

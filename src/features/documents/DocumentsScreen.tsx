import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { BottomSheet } from '@/components/BottomSheet';
import { Card } from '@/components/Card';
import { Icon, IconName } from '@/components/Icon';
import { IconChip } from '@/components/InfoRow';
import { PressableScale } from '@/components/PressableScale';
import { ShimmerList } from '@/components/ShimmerBox';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { AppDocument, documentsRepository, isImageDoc, readableSize, useDocuments } from './repository';

const titleize = (raw: string) => raw.split('_').map((w) => (w ? w[0] + w.slice(1).toLowerCase() : w)).join(' ');

function iconFor(d: AppDocument): IconName {
  if (isImageDoc(d)) return 'image';
  if (d.contentType === 'application/pdf') return 'picture-as-pdf';
  return 'description';
}

export function DocumentsScreen() {
  const { colors } = useTheme();
  const q = useDocuments();
  const [open, setOpen] = useState<AppDocument | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (q.isPending) return <View style={{ flex: 1, padding: Spacing.lg }}><ShimmerList count={3} height={64} /></View>;
  if (q.isError) {
    return <View style={{ flex: 1, alignItems: 'center', paddingTop: 100 }}><AppText variant="bodyMedium">Couldn't load your documents.</AppText><View style={{ height: Spacing.md }} /><SecondaryButton fullWidth={false} label="Retry" onPress={() => q.refetch()} /></View>;
  }

  return (
    <>
      <FlatList<AppDocument>
        data={q.data}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} colors={[colors.primary]}
          onRefresh={async () => { setRefreshing(true); await q.refetch(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 100, gap: Spacing.xs }}>
            <Icon name="inbox" size={48} color={colors.textSecondary} />
            <AppText variant="titleMedium" style={{ marginTop: Spacing.md }}>Nothing here yet</AppText>
            <AppText variant="bodyMedium" style={{ textAlign: 'center' }}>Documents collected during KYC will appear here.</AppText>
          </View>
        }
        renderItem={({ item }) => (
          <PressableScale onPress={() => setOpen(item)} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <IconChip icon={iconFor(item)} />
              <View style={{ flex: 1 }}>
                <AppText variant="titleMedium">{titleize(item.documentType)}</AppText>
                <AppText variant="bodySmall">v{item.version} · {readableSize(item.sizeBytes)} · {Fmt.date(item.createdAt)}</AppText>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </Card>
          </PressableScale>
        )}
      />
      {open ? <PreviewSheet doc={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function PreviewSheet({ doc, onClose }: { doc: AppDocument; onClose: () => void }) {
  const { colors } = useTheme();
  const [b64, setB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setB64(await documentsRepository.getContentBase64(doc.id)); }
    catch { setError("Couldn't load a preview for this file."); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet visible onClose={onClose}>
      <AppText variant="headlineSmall">{doc.documentType}</AppText>
      <AppText variant="bodySmall" style={{ marginTop: Spacing.xs }}>Version {doc.version} · {readableSize(doc.sizeBytes)} · {doc.contentType}</AppText>
      <View style={{ marginTop: Spacing.lg }}>
        {b64 && isImageDoc(doc) ? (
          <Image source={{ uri: `data:${doc.contentType};base64,${b64}` }} style={{ width: '100%', height: 320, borderRadius: Spacing.radiusMd }} resizeMode="contain" />
        ) : b64 ? (
          <AppText variant="bodyMedium">Preview isn’t available for this file type yet, but the file loaded successfully ({readableSize(doc.sizeBytes)}).</AppText>
        ) : error ? (
          <AppText variant="bodyMedium" color={colors.danger}>{error}</AppText>
        ) : loading ? (
          <View style={{ alignItems: 'center' }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <PrimaryButton label="View content" icon="visibility" onPress={load} />
        )}
      </View>
    </BottomSheet>
  );
}

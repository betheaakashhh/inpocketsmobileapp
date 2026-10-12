import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Icon, IconName } from '@/components/Icon';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { VerificationStatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { isOnboardingCompleted } from '@/features/onboarding/models';
import { getSnapshot, onboardingActions, refreshQuietly, useOnboarding } from '@/features/onboarding/useOnboarding';

/**
 * The camera capture is intentionally local-first: network access is only
 * needed when the user submits. A capture reference belongs to the captured
 * selfie, not to an individual HTTP attempt — so a retry after a
 * response-loss/network failure reuses the same submission identifier.
 */

// Only these mean the server already accepted a capture. FAILED and
// RETRY_REQUIRED must be allowed to submit a newly captured selfie.
const SERVER_HAS_CAPTURE = ['PROCESSING', 'VERIFIED', 'MANUAL_REVIEW'];

export default function IdentityVerificationScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { snapshot } = useOnboarding();
  const identity = snapshot?.identity ?? null;
  const onboardingComplete = snapshot ? isOnboardingCompleted(snapshot.record) : false;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [captureRef, setCaptureRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (poll.current) clearInterval(poll.current);
    };
  }, []);

  // Poll every 5 s while the server is working / awaiting onboarding completion.
  const status = identity?.status;
  useEffect(() => {
    const shouldPoll = status === 'PROCESSING' || status === 'PENDING' || (status === 'VERIFIED' && !onboardingComplete);
    if (shouldPoll && !poll.current) {
      poll.current = setInterval(() => { refreshQuietly(); }, 5000);
    } else if (!shouldPoll && poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }, [status, onboardingComplete]);

  const clearCapture = useCallback(() => {
    setImageUri(null);
    setCaptureRef(null);
  }, []);

  const captureSelfie = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        toast.show("Couldn't open the camera. Check camera permissions and try again.", 'error');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        cameraType: ImagePicker.CameraType.front,
        quality: 0.85,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets[0] && mounted.current) {
        const asset = res.assets[0];
        setImageUri(asset.uri);
        setCaptureRef(`selfie_${Date.now()}_${asset.fileSize ?? 0}`);
      }
    } catch (e) {
      if (!mounted.current) return;
      toast.show(
        e instanceof ApiException ? e.message : "Couldn't open the camera. Check camera permissions and try again.",
        'error',
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const submitCapture = async () => {
    if (!imageUri || !captureRef) return;
    setBusy(true);
    try {
      // Server already has a capture -> don't post a duplicate, just resume.
      const serverHasIt = (s?: string) => !!s && SERVER_HAS_CAPTURE.includes(s);
      if (serverHasIt(getSnapshot()?.identity?.status)) {
        if (mounted.current) clearCapture();
        return;
      }

      // A stale PENDING snapshot may hide a request that reached the backend
      // while its response was lost — refresh before posting again.
      await refreshQuietly();
      const refreshed = getSnapshot()?.identity ?? null;
      if (serverHasIt(refreshed?.status)) {
        if (mounted.current) clearCapture();
        return;
      }

      if (refreshed === null) await onboardingActions.startIdentity();

      await onboardingActions.submitIdentityCapture(captureRef);
      if (mounted.current) clearCapture();
    } catch (e) {
      // Keep BOTH the image and captureRef. If the request reached the server
      // but the response was lost, the next Submit refreshes server state
      // before attempting another POST.
      if (mounted.current) toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const showStatusCard =
    imageUri === null && identity !== null &&
    identity.status !== 'PENDING' && identity.status !== 'RETRY_REQUIRED' && identity.status !== 'FAILED';

  const needsRetry = identity?.status === 'FAILED' || identity?.status === 'RETRY_REQUIRED';

  let footer: React.ReactNode;
  if (imageUri !== null) {
    footer = (
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <View style={{ flex: 1 }}><SecondaryButton label="Retake" onPress={busy ? undefined : clearCapture} /></View>
        <View style={{ flex: 2 }}><PrimaryButton label="Submit" isLoading={busy} onPress={submitCapture} /></View>
      </View>
    );
  } else if (identity !== null && identity.status !== 'PENDING' && identity.status !== 'FAILED' && identity.status !== 'RETRY_REQUIRED') {
    footer = undefined;
  } else {
    footer = (
      <PrimaryButton label={identity === null || identity.status === 'PENDING' ? 'Take a selfie' : 'Retake selfie'} isLoading={busy} onPress={captureSelfie} />
    );
  }

  return (
    <OnboardingScaffold stepIndex={3} title="One last check" subtitle="A quick selfie confirms the person applying is really you." footer={footer}>
      {imageUri !== null ? (
        <View style={{ borderRadius: Spacing.radiusLg, overflow: 'hidden', aspectRatio: 3 / 4, backgroundColor: colors.surfaceAlt }}>
          <Image source={{ uri: imageUri }} style={{ flex: 1 }} resizeMode="cover" accessibilityLabel="Your captured selfie" />
        </View>
      ) : showStatusCard && identity ? (
        <IdentityStatusCard status={identity.status} reason={identity.failureReason} />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          <Bullet icon="wb-sunny" text="Good lighting, look straight at the camera." />
          <Bullet icon="block" text="No filters, hats, or sunglasses." />
          {needsRetry ? (
            <AppText variant="bodyMedium" color={colors.danger} style={{ marginTop: Spacing.sm }}>
              {identity?.failureReason ?? "That didn't go through — let's try once more."}
            </AppText>
          ) : null}
        </View>
      )}
    </OnboardingScaffold>
  );
}

function Bullet({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
      <Icon name={icon} size={20} color={colors.primary} />
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}

function IdentityStatusCard({ status, reason }: { status: string; reason: string | null }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="titleLarge">Identity check</AppText>
        <VerificationStatusChip status={status} />
      </View>
      <View style={{ marginTop: Spacing.sm }}>
        {status === 'PROCESSING' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <AppText variant="bodySmall" style={{ flex: 1 }}>We're reviewing your selfie. This updates automatically.</AppText>
          </View>
        ) : status === 'MANUAL_REVIEW' ? (
          <AppText variant="bodySmall">Your selfie is under manual review by our team.</AppText>
        ) : reason ? (
          <AppText variant="bodySmall">{reason}</AppText>
        ) : null}
      </View>
    </Card>
  );
}

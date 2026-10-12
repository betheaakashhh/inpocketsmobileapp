import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton } from '@/components/Buttons';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { PressableScale } from '@/components/PressableScale';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { Validators } from '@/core/utils/validators';
import { onboardingActions, useOnboarding } from '@/features/onboarding/useOnboarding';

/**
 * `gender`: the backend accepts a plain optional string with no enforced enum
 * in the schema — confirm the exact accepted values with the backend team.
 */
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function ProfileFormScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { snapshot } = useOnboarding();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ first?: string | null; last?: string | null; dob?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(new Date());
  const seeded = useRef(false);

  // Prefill once from whatever the backend already has.
  useEffect(() => {
    if (seeded.current || !snapshot) return;
    seeded.current = true;
    const p = snapshot.profile;
    setFirstName(p.firstName ?? '');
    setLastName(p.lastName ?? '');
    setDob(p.dateOfBirth);
    setGender(p.gender);
  }, [snapshot]);

  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const maxDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const initialDate = dob ?? new Date(now.getFullYear() - 25, 0, 1);

  const pickDob = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initialDate, mode: 'date', minimumDate: minDate, maximumDate: maxDate,
        onValueChange: (_e, d) => { setDob(d); setErrors((x) => ({ ...x, dob: null })); },
      });
    } else {
      setIosDraft(initialDate);
      setIosPickerOpen(true);
    }
  };

  const submit = async () => {
    const first = Validators.requiredName(firstName, 'First name');
    const last = Validators.requiredName(lastName, 'Last name');
    const dobErr = dob ? null : 'Select your date of birth';
    setErrors({ first, last, dob: dobErr });
    if (first || last || dobErr) return;

    setSubmitting(true);
    try {
      await onboardingActions.saveProfile({ firstName: firstName.trim(), lastName: lastName.trim(), dateOfBirth: dob!, gender });
      // The route gate takes over (current_step is now PAN).
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingScaffold
      stepIndex={0}
      title="Tell us about you"
      subtitle="Let's start with the basics — this should take a minute."
      footer={<PrimaryButton label="Continue" isLoading={submitting} onPress={submit} />}
    >
      <View style={{ gap: Spacing.md }}>
        <TextField label="First name" value={firstName} autoCapitalize="words" errorText={errors.first}
          onChangeText={(t) => { setFirstName(t); setErrors((e) => ({ ...e, first: null })); }} />
        <TextField label="Last name" value={lastName} autoCapitalize="words" errorText={errors.last}
          onChangeText={(t) => { setLastName(t); setErrors((e) => ({ ...e, last: null })); }} />

        <View>
          <AppText variant="labelLarge" color={colors.text}>Date of birth</AppText>
          <PressableScale
            onPress={pickDob}
            accessibilityRole="button"
            style={{
              marginTop: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              paddingHorizontal: Spacing.md, paddingVertical: 16, borderRadius: Spacing.radiusMd, borderWidth: 1,
              backgroundColor: colors.surfaceAlt, borderColor: errors.dob ? colors.danger : colors.border,
            }}
          >
            <Icon name="cake" size={20} color={colors.textSecondary} />
            <AppText variant="bodyLarge" color={dob ? colors.text : colors.textSecondary}>{dob ? Fmt.date(dob) : 'Select date'}</AppText>
          </PressableScale>
          {errors.dob ? <AppText variant="bodySmall" color={colors.danger} style={{ marginTop: Spacing.xs }}>{errors.dob}</AppText> : null}
        </View>

        <View>
          <AppText variant="labelLarge" color={colors.text}>Gender (optional)</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {GENDER_OPTIONS.map((o) => (
              <Chip key={o} label={o} selected={gender === o} onPress={() => setGender(gender === o ? null : o)} />
            ))}
          </View>
        </View>
        <View style={{ height: Spacing.lg }} />
      </View>

      {Platform.OS === 'ios' ? (
        <BottomSheet visible={iosPickerOpen} onClose={() => setIosPickerOpen(false)}>
          <AppText variant="headlineSmall">Date of birth</AppText>
          <DateTimePicker value={iosDraft} mode="date" display="spinner" minimumDate={minDate} maximumDate={maxDate}
            themeVariant={colors.isDark ? 'dark' : 'light'} onValueChange={(_e, d) => setIosDraft(d)} />
          <PrimaryButton label="Done" onPress={() => { setDob(iosDraft); setErrors((x) => ({ ...x, dob: null })); setIosPickerOpen(false); }} />
        </BottomSheet>
      ) : null}
    </OnboardingScaffold>
  );
}

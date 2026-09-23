import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/Buttons';
import { FieldLabel, NumberField, TextField } from '../../components/FieldBox';
import { OnboardingHeader } from '../../components/OnboardingDots';
import { SegmentedControl } from '../../components/Chip';
import { useLanguage } from '../../i18n/LanguageContext';
import { RootStackParamList } from '../../navigation/types';
import { useOnboardingDraft } from '../../state/OnboardingDraftContext';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/tokens';
import { Sex } from '../../utils/calorie';

type Props = NativeStackScreenProps<RootStackParamList, 'OnbBody'>;

export default function OnbBodyScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { draft, update } = useOnboardingDraft();
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  const totalInches = draft.heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);

  const setFeetInches = (ft: number, inch: number) => {
    update({ heightCm: Math.round((ft * 12 + inch) * 2.54 * 10) / 10 });
  };

  const canContinue = draft.name.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingHeader step={1} total={5} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
          {t.onbBody}
        </Text>
        <View style={{ gap: 18, marginTop: 24 }}>
          <View>
            <FieldLabel>{t.yourName}</FieldLabel>
            <TextField value={draft.name} onChangeText={(v) => update({ name: v })} placeholder={t.namePh} />
          </View>

          <View>
            <FieldLabel>{t.age}</FieldLabel>
            <NumberField value={draft.age} onChangeValue={(n) => update({ age: Math.round(n) })} unit={t.years} />
          </View>

          <View>
            <FieldLabel>{t.sex}</FieldLabel>
            <SegmentedControl<Sex>
              value={draft.sex}
              onChange={(v) => update({ sex: v })}
              options={[
                { value: 'female', label: t.female },
                { value: 'male', label: t.male },
              ]}
            />
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <FieldLabel>{t.height}</FieldLabel>
              <SegmentedControl<'cm' | 'ft'>
                value={heightUnit}
                onChange={setHeightUnit}
                options={[
                  { value: 'cm', label: 'cm' },
                  { value: 'ft', label: 'ft' },
                ]}
              />
            </View>
            {heightUnit === 'cm' ? (
              <NumberField value={Math.round(draft.heightCm)} onChangeValue={(n) => update({ heightCm: n })} unit="cm" />
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <NumberField value={feet} onChangeValue={(n) => setFeetInches(n, inches)} unit={t.ft} />
                </View>
                <View style={{ flex: 1 }}>
                  <NumberField value={inches} onChangeValue={(n) => setFeetInches(feet, n)} unit="in" />
                </View>
              </View>
            )}
          </View>

          <View>
            <FieldLabel>{t.weight}</FieldLabel>
            <NumberField value={draft.weightKg} onChangeValue={(n) => update({ weightKg: n })} unit="kg" />
          </View>
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
        <PrimaryButton label={t.next} onPress={() => navigation.navigate('OnbActivity')} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

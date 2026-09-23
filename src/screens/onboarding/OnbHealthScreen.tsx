import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '../../components/OnboardingDots';
import { OptionRow } from '../../components/OptionRow';
import { PrimaryButton } from '../../components/Buttons';
import { useLanguage } from '../../i18n/LanguageContext';
import { RootStackParamList } from '../../navigation/types';
import { useOnboardingDraft } from '../../state/OnboardingDraftContext';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OnbHealth'>;
type DiabeticAnswer = 'yes' | 'no' | 'unsure';

export default function OnbHealthScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { draft, update } = useOnboardingDraft();

  const options: { value: DiabeticAnswer; label: string }[] = [
    { value: 'yes', label: t.yes },
    { value: 'no', label: t.no },
    { value: 'unsure', label: t.notSure },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingHeader step={3} total={5} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
          {t.onbHealth}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.muted, marginTop: 10, lineHeight: 15 * fonts.lineHeightMultiplier }}>
          {t.healthNote}
        </Text>
        <View style={{ gap: 10, marginTop: 24 }}>
          {options.map((o) => (
            <OptionRow key={o.value} label={o.label} selected={draft.diabetic === o.value} onPress={() => update({ diabetic: o.value })} />
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
        <PrimaryButton label={t.next} onPress={() => navigation.navigate('OnbResult')} />
      </View>
    </SafeAreaView>
  );
}

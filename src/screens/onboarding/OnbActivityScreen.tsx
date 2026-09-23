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
import { ActivityLevel } from '../../utils/calorie';

type Props = NativeStackScreenProps<RootStackParamList, 'OnbActivity'>;

export default function OnbActivityScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { draft, update } = useOnboardingDraft();

  const options: { value: ActivityLevel; label: string }[] = [
    { value: 1, label: t.a1 },
    { value: 2, label: t.a2 },
    { value: 3, label: t.a3 },
    { value: 4, label: t.a4 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingHeader step={2} total={5} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
          {t.onbAct}
        </Text>
        <View style={{ gap: 10, marginTop: 24 }}>
          {options.map((o) => (
            <OptionRow key={o.value} label={o.label} selected={draft.activity === o.value} onPress={() => update({ activity: o.value })} tall />
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
        <PrimaryButton label={t.next} onPress={() => navigation.navigate('OnbHealth')} />
      </View>
    </SafeAreaView>
  );
}

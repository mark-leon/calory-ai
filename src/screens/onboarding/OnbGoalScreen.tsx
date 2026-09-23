import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { OnboardingHeader } from '../../components/OnboardingDots';
import { OptionRow } from '../../components/OptionRow';
import { PrimaryButton } from '../../components/Buttons';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { useOnboardingDraft } from '../../state/OnboardingDraftContext';
import { Goal } from '../../utils/calorie';
import { RootStackParamList } from '../../navigation/types';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'OnbGoal'>;

export default function OnbGoalScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { draft, update } = useOnboardingDraft();

  const goals: { value: Goal; label: string }[] = [
    { value: 'lose', label: t.gLose },
    { value: 'maintain', label: t.gMaintain },
    { value: 'gain', label: t.gGain },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingHeader step={0} total={5} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
          {t.onbGoal}
        </Text>
        <View style={{ gap: 10, marginTop: 24 }}>
          {goals.map((g) => (
            <OptionRow key={g.value} label={g.label} selected={draft.goal === g.value} onPress={() => update({ goal: g.value })} />
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
        <PrimaryButton label={t.next} onPress={() => navigation.navigate('OnbBody')} />
      </View>
    </SafeAreaView>
  );
}

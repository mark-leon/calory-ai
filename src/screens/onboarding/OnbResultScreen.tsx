import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/Buttons';
import { Card } from '../../components/Cards';
import { Icon } from '../../components/Icon';
import { MacroBar } from '../../components/MacroBar';
import { OnboardingHeader } from '../../components/OnboardingDots';
import { useLanguage } from '../../i18n/LanguageContext';
import { RootStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { useOnboardingDraft } from '../../state/OnboardingDraftContext';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/tokens';
import { GOAL_ADJUSTMENT, OnboardingProfile, calculateDailyTarget, macroTargets } from '../../utils/calorie';

type Props = NativeStackScreenProps<RootStackParamList, 'OnbResult'>;

export default function OnbResultScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { draft } = useOnboardingDraft();
  const { completeOnboarding } = useAppState();

  const profile: OnboardingProfile = {
    goal: draft.goal,
    age: draft.age,
    sex: draft.sex,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    activity: draft.activity,
    diabetic: draft.diabetic,
  };
  const dailyTarget = calculateDailyTarget(profile);
  const diabetic = draft.diabetic === 'yes';
  const macros = macroTargets(dailyTarget, diabetic);

  const explain =
    draft.goal === 'lose' ? t.resultExplain(GOAL_ADJUSTMENT) : draft.goal === 'gain' ? t.resultExplainGain(GOAL_ADJUSTMENT) : t.resultExplainMaintain;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <OnboardingHeader step={4} total={5} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.muted, lineHeight: 15 * fonts.lineHeightMultiplier }}>{t.onbResult}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 40, fontWeight: '600', letterSpacing: -1.4, lineHeight: 46, color: colors.accent }}>
            {dailyTarget.toLocaleString('en-US')}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 20, color: colors.muted }}>{t.kcalDay}</Text>
        </View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.ink, marginTop: 14, lineHeight: 15 * fonts.lineHeightMultiplier }}>{explain}</Text>

        <Card style={{ marginTop: 20, gap: 12 }}>
          <MacroBar name={t.protein} have={macros.protein} goal={macros.protein} color={colors.success} barPct={20} targetOnly />
          <MacroBar name={t.carbs} have={macros.carbs} goal={macros.carbs} color={colors.accent} barPct={diabetic ? 45 : 50} targetOnly />
          <MacroBar name={t.fat} have={macros.fat} goal={macros.fat} color={colors.warn} barPct={diabetic ? 35 : 30} targetOnly />
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 }}>
          <Icon name="info" size={16} color={colors.muted} />
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 19 }}>{t.disclaimer}</Text>
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
        <PrimaryButton label={t.start} onPress={() => completeOnboarding(profile, draft.name.trim())} />
      </View>
    </SafeAreaView>
  );
}

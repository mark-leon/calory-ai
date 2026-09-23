import React from 'react';
import { Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { GiLevel } from '../data/foods';

export function MacroBar({
  name,
  have,
  goal,
  color,
  large,
  gi,
  barPct,
  targetOnly,
}: {
  name: string;
  have: number;
  goal: number;
  color: string;
  large?: boolean;
  gi?: GiLevel;
  /** Override the fill percentage — used on onboarding's result screen to show
   * each macro's share of total calories rather than progress toward a goal. */
  barPct?: number;
  /** Show just the goal amount (e.g. onboarding's target breakdown) instead of have/goal progress. */
  targetOnly?: boolean;
}) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const pct = barPct ?? Math.min(100, Math.round((have / goal) * 100));
  const giLabel = gi === 'low' ? t.giLow : gi === 'high' ? t.giHigh : t.giMed;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontFamily: fonts.medium, fontSize: large ? 20 : 15, color: colors.ink }}>{name}</Text>
        {targetOnly ? (
          <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: colors.ink, fontVariant: ['tabular-nums'] }}>{goal} g</Text>
        ) : (
          <Text style={{ fontSize: large ? 20 : 15, color: colors.muted, fontVariant: ['tabular-nums'] }}>
            <Text style={{ color: colors.ink, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>{have}</Text> / {goal} g
          </Text>
        )}
      </View>
      <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />
      </View>
      {gi ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.warnSoft }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors.warn }} />
            <Text style={{ fontSize: 13, color: colors.warn, fontFamily: fonts.medium, fontWeight: '500' }}>{giLabel}</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t.giNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

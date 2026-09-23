import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ eaten, target, over }: { eaten: number; target: number; over: boolean }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const pct = Math.min(1, eaten / target);
  const dash = over ? CIRCUMFERENCE : CIRCUMFERENCE * pct;
  const ringColor = over ? colors.warn : colors.accent;
  const remaining = target - eaten;
  const bigNum = over ? remaining * -1 : remaining;
  const bigLabel = over ? t.overWord : t.remaining;

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={colors.border} strokeWidth={STROKE} />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
        />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 40, fontWeight: '600', letterSpacing: -1.4, lineHeight: 42, color: ringColor }}>
          {bigNum.toLocaleString('en-US')}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 16 }}>{bigLabel}</Text>
      </View>
    </View>
  );
}

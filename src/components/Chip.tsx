import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';
import { Icon, IconName } from './Icon';

export function Chip({
  label,
  selected,
  onPress,
  icon,
  tone = 'neutral',
  trailing,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'neutral' | 'accent' | 'warn' | 'success';
  trailing?: string;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();

  const toneColors: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'transparent', fg: colors.ink },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    warn: { bg: colors.warnSoft, fg: colors.warn },
    success: { bg: colors.successSoft, fg: colors.success },
  };
  const active = selected ? { bg: colors.accent, fg: '#fff' } : toneColors[tone];

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={{
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 13,
        borderRadius: radius.pill,
        backgroundColor: active.bg,
        borderWidth: tone === 'neutral' && !selected ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      {icon ? <Icon name={icon} size={16} color={active.fg} /> : null}
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, fontWeight: selected ? '600' : '500', color: active.fg, lineHeight: 22 }}>
        {label}
      </Text>
      {trailing ? (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, opacity: 0.75, color: active.fg }}>{trailing}</Text>
      ) : null}
    </Wrapper>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, padding: 3, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              minHeight: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: active ? colors.accent : 'transparent',
            }}
          >
            <Text style={{ fontFamily: active ? fonts.semiBold : fonts.medium, fontSize: 15, color: active ? '#fff' : colors.muted }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

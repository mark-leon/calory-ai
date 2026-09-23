import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>{title}</Text>
      <View style={{ marginTop: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

export function SettingsRow({
  label,
  value,
  toggle,
  onToggle,
  onPress,
  color,
  divider,
}: {
  label: string;
  value?: string;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  color?: string;
  divider?: boolean;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={{ borderTopWidth: divider ? 1 : 0, borderTopColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 52 }}>
        <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: color || colors.ink }}>{label}</Text>
        {value ? <Text style={{ fontSize: 15, color: colors.muted, fontVariant: ['tabular-nums'] }}>{value}</Text> : null}
        {toggle !== undefined ? (
          <Switch
            value={toggle}
            onValueChange={onToggle}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#fff"
          />
        ) : onPress ? (
          <Icon name="chevron-right" size={18} color={colors.muted} />
        ) : null}
      </View>
    </Wrapper>
  );
}

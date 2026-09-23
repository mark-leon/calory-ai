import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, disabled, loading, style }: ButtonProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled ? colors.border : colors.accent,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginRight: spacing.sm }} />
      ) : null}
      <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: disabled ? colors.muted : '#fff' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style, textColor }: ButtonProps & { textColor?: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: textColor || colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function DashedSlotButton({ label, onPress, style }: ButtonProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: pressed ? colors.accent : colors.border,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.muted }}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress, color, style }: ButtonProps & { color?: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable onPress={onPress} style={style} hitSlop={8}>
      <Text
        style={{
          fontFamily: fonts.semiBold,
          fontSize: 15,
          fontWeight: '600',
          color: color || colors.accent,
          textDecorationLine: 'underline',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});

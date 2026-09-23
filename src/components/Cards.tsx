import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';
import { Icon } from './Icon';
import { SecondaryButton } from './Buttons';

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.card,
          boxShadow: colors.shadow,
          elevation: 1,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Card style={{ padding: 14, paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 28, fontWeight: '600', letterSpacing: -0.8, color: colors.ink, lineHeight: 32 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 }}>{label}</Text>
    </Card>
  );
}

export function ErrorCard({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  return (
    <View style={{ padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Icon name="warning-circle" size={22} color={colors.warn} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink, lineHeight: 22 }}>{title}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 19 }}>{body}</Text>
        </View>
      </View>
      {onRetry ? <SecondaryButton label={t.retry} onPress={onRetry} style={{ marginTop: 12 }} /> : null}
    </View>
  );
}

export function OfflineBanner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 20, backgroundColor: colors.warnSoft, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Icon name="wifi-off" size={16} color={colors.warn} />
      <Text style={{ fontSize: 13, color: colors.ink, flex: 1 }}>{t.offline}</Text>
    </View>
  );
}

export function Toast({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View
      style={{
        position: 'absolute',
        left: spacing.xl,
        right: spacing.xl,
        bottom: 104,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 13,
        paddingHorizontal: 14,
        backgroundColor: colors.ink,
        borderRadius: radius.input,
        boxShadow: '0 4px 14px rgba(28,26,23,0.22)',
        elevation: 6,
        zIndex: 20,
      }}
    >
      <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.surface }}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.accent }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

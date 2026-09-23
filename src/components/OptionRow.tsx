import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';

export function OptionRow({ label, selected, onPress, tall }: { label: string; selected: boolean; onPress: () => void; tall?: boolean }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: tall ? 64 : 60,
        paddingHorizontal: 16,
        paddingVertical: tall ? 12 : 0,
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.border,
        borderRadius: radius.card,
        boxShadow: colors.shadow,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: selected ? colors.accent : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 11, height: 11, borderRadius: 999, backgroundColor: selected ? colors.accent : 'transparent' }} />
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, fontWeight: '500', color: colors.ink, lineHeight: 22 }}>{label}</Text>
    </Pressable>
  );
}

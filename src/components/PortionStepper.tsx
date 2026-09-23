import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

export function PortionStepper({
  qty,
  unitLabel,
  onIncrement,
  onDecrement,
}: {
  qty: number;
  unitLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const qtyLabel = (Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 999, overflow: 'hidden' }}>
      <Pressable
        onPress={onDecrement}
        style={({ pressed }) => [{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.accentSoft : 'transparent' }]}
      >
        <Icon name="minus" size={18} color={colors.ink} />
      </Pressable>
      <Text style={{ minWidth: 78, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink }}>
        {qtyLabel} {unitLabel}
      </Text>
      <Pressable
        onPress={onIncrement}
        style={({ pressed }) => [{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.accentSoft : 'transparent' }]}
      >
        <Icon name="plus" size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

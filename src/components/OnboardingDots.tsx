import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Icon } from './Icon';

export function OnboardingHeader({ step, total, onBack }: { step: number; total: number; onBack?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 }}>
      <Pressable
        onPress={onBack}
        disabled={!onBack}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: onBack ? 1 : 0 }}
      >
        <Icon name="chevron-left" size={22} color={colors.ink} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              height: 7,
              width: i === step ? 20 : 7,
              borderRadius: 999,
              backgroundColor: i <= step ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

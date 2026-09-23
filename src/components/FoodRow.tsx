import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { LoggedItem } from '../state/types';
import { StripePlaceholder } from './StripePlaceholder';
import { Icon } from './Icon';

const REVEAL_WIDTH = 84;

export function FoodRow({
  item,
  onDelete,
  onLongPress,
}: {
  item: LoggedItem;
  onDelete: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const snapTo = (toValue: number) => {
    openRef.current = toValue !== 0;
    Animated.spring(translateX, { toValue, useNativeDriver: true, bounciness: 0, speed: 22 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? -REVEAL_WIDTH : 0;
        const next = Math.min(0, Math.max(-REVEAL_WIDTH, base + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const base = openRef.current ? -REVEAL_WIDTH : 0;
        const projected = base + g.dx;
        snapTo(projected < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0);
      },
    })
  ).current;

  const name = lang === 'en' ? item.en : item.bn;
  const portionLabel = `${item.qty} ${lang === 'en' ? item.unitEn : item.unitBn}`;

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={{ position: 'absolute', inset: 0, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={() => {
            snapTo(0);
            onDelete();
          }}
          style={{ width: REVEAL_WIDTH, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', gap: 3 }}
        >
          <Icon name="trash" size={20} color="#fff" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{t.delete}</Text>
        </Pressable>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }], backgroundColor: colors.card }}
      >
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={350}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 68 }}
        >
          <StripePlaceholder width={44} height={44} radius={10} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.medium, fontSize: 15, fontWeight: '500', color: colors.ink, lineHeight: fonts.lineHeightMultiplier * 15 }}>
              {name}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.muted, lineHeight: 19 }}>
              {portionLabel}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, fontWeight: '600', color: colors.ink }}>{item.kcal}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

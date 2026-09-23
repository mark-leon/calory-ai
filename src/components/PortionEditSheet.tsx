import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';
import { LoggedItem } from '../state/types';
import { foodById } from '../data/foods';
import { PortionStepper } from './PortionStepper';
import { PrimaryButton } from './Buttons';

export function PortionEditSheet({
  item,
  onClose,
  onSave,
}: {
  item: LoggedItem | null;
  onClose: () => void;
  onSave: (qty: number) => void;
}) {
  const { colors } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const [qty, setQty] = useState(item?.qty ?? 1);

  React.useEffect(() => {
    if (item) setQty(item.qty);
  }, [item?.id]);

  if (!item) return null;
  const food = foodById(item.foodId);
  const step = qty < 1 ? 0.25 : 0.5;
  const kcalPreview = food ? Math.round(food.kcalPerUnit * qty) : item.kcal;
  const unitLabel = lang === 'en' ? item.unitEn : item.unitBn;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.card,
          borderTopRightRadius: radius.card,
        }}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={{ padding: spacing.xl, gap: spacing.lg }}>
            <View>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink, lineHeight: 27 }}>
                {lang === 'en' ? item.en : item.bn}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{lang === 'en' ? item.bn : item.en}</Text>
            </View>
            <View style={{ alignItems: 'center', gap: spacing.md }}>
              <PortionStepper
                qty={qty}
                unitLabel={unitLabel}
                onIncrement={() => setQty((q) => Math.round((q + step) * 100) / 100)}
                onDecrement={() => setQty((q) => Math.max(0.25, Math.round((q - step) * 100) / 100))}
              />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 28, fontWeight: '600', color: colors.ink }}>
                {kcalPreview} <Text style={{ fontSize: 15, fontWeight: '500', color: colors.muted }}>kcal</Text>
              </Text>
            </View>
            <PrimaryButton label={t.done} onPress={() => onSave(qty)} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

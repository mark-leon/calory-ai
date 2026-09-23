import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './Buttons';
import { NumberField } from './FieldBox';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';

export function WeightEntrySheet({
  visible,
  initialKg,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialKg: number;
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const [kg, setKg] = useState(initialKg);

  React.useEffect(() => {
    if (visible) setKg(initialKg);
  }, [visible, initialKg]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ padding: spacing.xl, gap: spacing.lg }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{t.addWeight}</Text>
            <NumberField value={kg} onChangeValue={setKg} unit={t.kg} />
            <PrimaryButton label={t.done} onPress={() => onSave(kg)} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './Buttons';
import { FieldLabel, NumberField, TextField } from './FieldBox';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';

export function CustomFoodSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, kcal: number) => void;
}) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState(200);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}>
        <SafeAreaView edges={['bottom']}>
          <View style={{ padding: spacing.xl, gap: spacing.lg }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{t.addCustom}</Text>
            <View>
              <FieldLabel>{t.customName}</FieldLabel>
              <TextField value={name} onChangeText={setName} placeholder={t.searchPh} />
            </View>
            <View>
              <FieldLabel>{t.customKcal}</FieldLabel>
              <NumberField value={kcal} onChangeValue={(n) => setKcal(Math.max(0, Math.round(n)))} unit="kcal" />
            </View>
            <PrimaryButton
              label={t.add}
              disabled={name.trim().length === 0}
              onPress={() => {
                onAdd(name.trim(), kcal);
                setName('');
                setKcal(200);
              }}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

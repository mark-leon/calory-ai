import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';

export function FieldLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 }}>{children}</Text>;
}

export function NumberField({
  value,
  onChangeValue,
  unit,
  focused,
}: {
  value: number;
  onChangeValue: (n: number) => void;
  unit?: string;
  focused?: boolean;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const [text, setText] = React.useState(String(value));

  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingHorizontal: 14,
        backgroundColor: colors.card,
        borderWidth: focused ? 1.5 : 1,
        borderColor: focused ? colors.accent : colors.border,
        borderRadius: radius.input,
      }}
    >
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          const n = parseFloat(t.replace(',', '.'));
          if (!Number.isNaN(n)) onChangeValue(n);
        }}
        onBlur={() => setText(String(value))}
        keyboardType="decimal-pad"
        style={{ flex: 1, fontSize: 20, fontWeight: '600', color: colors.ink, padding: 0 }}
      />
      {unit ? (
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.muted, marginLeft: 6 }}>{unit}</Text>
      ) : null}
    </View>
  );
}

export function TextField({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingHorizontal: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, padding: 0 }}
      />
    </View>
  );
}

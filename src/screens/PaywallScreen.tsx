import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, TextLink } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;
type Plan = 'monthly' | 'yearly';
type PayMethod = 'bkash' | 'nagad' | 'card';

export default function PaywallScreen({ navigation }: Props) {
  const { colors, mode } = useTheme();
  const { t, fonts } = useLanguage();
  const { subscribe } = useAppState();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [payMethod, setPayMethod] = useState<PayMethod>('bkash');

  const benefits = [
    { title: t.b1, sub: t.b1s },
    { title: t.b2, sub: t.b2s },
    { title: t.b3, sub: t.b3s },
  ];
  const methods: { key: PayMethod; mark: string; name: string; sub: string }[] = [
    { key: 'bkash', mark: 'bK', name: 'bKash', sub: t.mobileBanking },
    { key: 'nagad', mark: 'Ng', name: 'Nagad', sub: t.mobileBanking },
    { key: 'card', mark: 'card', name: t.cardLabel, sub: 'Visa, Mastercard' },
  ];

  const goBackToMain = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'));

  const confirm = () => {
    subscribe(plan);
    goBackToMain();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 14, paddingTop: 6 }}>
        <Pressable onPress={goBackToMain} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x-close" size={22} color={colors.muted} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: 4 }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.4, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
          {t.payTitle}
        </Text>
        <Text style={{ marginTop: 8, fontSize: 15, color: colors.muted, lineHeight: 15 * fonts.lineHeightMultiplier }}>{t.payBody}</Text>

        <View style={{ gap: 14, marginTop: 22 }}>
          {benefits.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink }}>{b.title}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{b.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <PlanCard active={plan === 'monthly'} onPress={() => setPlan('monthly')} label={t.monthly} price="৳ 149" sub={t.perMonth} />
          <PlanCard active={plan === 'yearly'} onPress={() => setPlan('yearly')} label={t.yearly} price="৳ 1,190" sub={t.perYear} badge={t.save33} />
        </View>

        <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.muted, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 22 }}>
          {t.payWith}
        </Text>
        <View style={{ marginTop: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
          {methods.map((m, i) => (
            <Pressable
              key={m.key}
              onPress={() => setPayMethod(m.key)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}
            >
              <View style={{ width: 40, height: 28, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.muted }}>{m.mark}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}>{m.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{m.sub}</Text>
              </View>
              <View style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 1.5, borderColor: payMethod === m.key ? colors.accent : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {payMethod === m.key ? <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.accent }} /> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PrimaryButton label={`${t.b1} · ${plan === 'yearly' ? `৳ 1,190${t.perYear}` : `৳ 149${t.perMonth}`}`} onPress={confirm} />
        <TextLink label={t.continueFree} color={colors.ink} onPress={goBackToMain} style={{ alignSelf: 'center', marginTop: 10 }} />
      </View>
    </SafeAreaView>
  );
}

function PlanCard({ active, onPress, label, price, sub, badge }: { active: boolean; onPress: () => void; label: string; price: string; sub: string; badge?: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, position: 'relative', backgroundColor: colors.card, borderWidth: 1.5, borderColor: active ? colors.accent : colors.border,
        borderRadius: radius.card, padding: 14,
      }}
    >
      {badge ? (
        <View style={{ position: 'absolute', top: -11, left: 12, paddingVertical: 2, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.accent }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{badge}</Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: colors.ink, marginTop: 2 }}>{price}</Text>
      <Text style={{ fontSize: 13, color: colors.muted }}>{sub}</Text>
    </Pressable>
  );
}

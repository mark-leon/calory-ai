import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { Card, ErrorCard } from '../components/Cards';
import { Icon } from '../components/Icon';
import { PortionStepper } from '../components/PortionStepper';
import { StripePlaceholder } from '../components/StripePlaceholder';
import { FOODS } from '../data/foods';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { foodToLoggedItem, useAppState } from '../state/AppStateContext';
import { MealType } from '../state/types';
import { useTheme } from '../theme/ThemeContext';
import { guessMealTypeForHour } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanResult'>;

// A canned "recognition" result standing in for the real vision model this
// handoff doesn't include — a plate of rice, dal, fried hilsa and potato
// bhorta, with the hilsa deliberately below the 0.6 confidence bar so the
// low-confidence treatment (amber border + "Check this" chip) is reachable.
const SCAN_FOOD_IDS = ['rice', 'dal-red', 'hilsa-fried', 'bhorta-alu'];
const SCAN_CONFIDENCE = [0.94, 0.88, 0.54, 0.81];
const INITIAL_QTY = [1, 1, 1, 2];

interface ScanItem {
  foodId: string;
  qty: number;
  confidence: number;
}

export default function ScanResultScreen({ route, navigation }: Props) {
  const { photoUri, failed } = route.params;
  const { colors, mode } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const { addItems } = useAppState();

  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState<ScanItem[]>(
    SCAN_FOOD_IDS.map((foodId, i) => ({ foodId, qty: INITIAL_QTY[i], confidence: SCAN_CONFIDENCE[i] }))
  );
  const [mealType, setMealType] = useState<MealType>(guessMealTypeForHour(new Date().getHours()));

  const foodsWithData = items.map((it) => ({ ...it, food: FOODS.find((f) => f.id === it.foodId)! }));
  const total = foodsWithData.reduce((n, it) => n + Math.round(it.food.kcalPerUnit * it.qty), 0);

  const mealOptions: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t.mtBreakfast },
    { value: 'lunch', label: t.mtLunch },
    { value: 'snack', label: t.mtSnack },
    { value: 'dinner', label: t.mtDinner },
  ];

  const setQty = (index: number, qty: number) => {
    setItems((arr) => arr.map((it, i) => (i === index ? { ...it, qty } : it)));
  };
  const removeAt = (index: number) => {
    setItems((arr) => arr.filter((_, i) => i !== index));
  };

  const commitToLog = () => {
    const logged = foodsWithData.map((it) => foodToLoggedItem(it.foodId, it.qty, it.confidence));
    addItems(mealType, logged);
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['bottom']}>
      <StatusBar style="light" />
      <View style={{ height: collapsed ? 0 : 172, position: 'relative', overflow: 'hidden', backgroundColor: '#1A1713' }}>
        <Image source={{ uri: photoUri }} style={{ position: 'absolute', inset: 0, width: '100%', height: 172 }} resizeMode="cover" />
      </View>
      <SafeAreaView edges={['top']} style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10 }}>
          <Pressable onPress={() => navigation.navigate('Main')} style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-left" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => setCollapsed((c) => !c)}
            style={{ height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13 }}>{collapsed ? t.expand : t.collapse}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {!failed ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 108, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.muted }}>{t.totalLabel}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 40, fontWeight: '600', letterSpacing: -1.4, lineHeight: 44, color: colors.ink }}>
                  {total} <Text style={{ fontSize: 20, fontWeight: '500', color: colors.muted }}>kcal</Text>
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, padding: 3, maxWidth: 190, justifyContent: 'flex-end' }}>
                {mealOptions.map((opt) => {
                  const active = opt.value === mealType;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setMealType(opt.value)}
                      style={{ minHeight: 34, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.accent : 'transparent' }}
                    >
                      <Text style={{ fontFamily: fonts.medium, fontSize: 13, fontWeight: '500', color: active ? '#fff' : colors.muted }}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {foodsWithData.map((it, index) => {
              const low = it.confidence < 0.6;
              const kcal = Math.round(it.food.kcalPerUnit * it.qty);
              const unitLabel = lang === 'en' ? it.food.unitEn : it.food.unitBn;
              return (
                <Card key={it.foodId} style={{ borderColor: low ? colors.warn : colors.border, paddingBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <StripePlaceholder width={48} height={48} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', letterSpacing: -0.2, color: colors.ink, lineHeight: 20 * fonts.lineHeightMultiplier }}>
                        {lang === 'en' ? it.food.en : it.food.bn}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>{lang === 'en' ? it.food.bn : it.food.en}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: colors.ink }}>{kcal}</Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>kcal</Text>
                    </View>
                  </View>

                  {low ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, padding: 8, paddingHorizontal: 10, backgroundColor: colors.warnSoft, borderRadius: 12 }}>
                      <Icon name="warning-circle" size={16} color={colors.warn} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.warn }}>{t.checkThis}</Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>{t.lowConf}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <PortionStepper
                      qty={it.qty}
                      unitLabel={unitLabel}
                      onIncrement={() => setQty(index, Math.round((it.qty + (it.qty < 1 ? 0.25 : 0.5)) * 100) / 100)}
                      onDecrement={() => setQty(index, Math.max(0.25, Math.round((it.qty - (it.qty <= 1 ? 0.25 : 0.5)) * 100) / 100))}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Pressable
                      onPress={() => {
                        removeAt(index);
                        navigation.navigate('Search', { mealType });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}
                    >
                      <Icon name="search" size={16} color={colors.accent} />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.accent }}>{t.wrongDish}</Text>
                    </Pressable>
                    <Pressable onPress={() => removeAt(index)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
                      <Icon name="remove" size={16} color={colors.muted} />
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.muted }}>{t.remove}</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}

            <Pressable
              onPress={() => navigation.navigate('Search', { mealType })}
              style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 16 }}
            >
              <Icon name="plus" size={18} color={colors.ink} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, fontWeight: '500', color: colors.ink }}>{t.addMissing}</Text>
            </Pressable>
          </ScrollView>

          <View style={{ padding: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
            <PrimaryButton label={`${t.addToLog} · ${total} kcal`} onPress={commitToLog} disabled={items.length === 0} />
          </View>
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <ErrorCard title={t.failTitle} body={t.failBody} />
          <View style={{ gap: 8, marginTop: 8 }}>
            <PrimaryButton label={t.retake} onPress={() => navigation.replace('Camera')} />
            <SecondaryButton label={t.manualSearch} onPress={() => navigation.navigate('Search')} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Image source={{ uri: photoUri }} style={{ width: 32, height: 32, borderRadius: 8 }} />
            <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }}>{t.photoKept}</Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

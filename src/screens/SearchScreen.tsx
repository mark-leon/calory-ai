import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/Buttons';
import { Chip } from '../components/Chip';
import { CustomFoodSheet } from '../components/CustomFoodSheet';
import { Icon } from '../components/Icon';
import { PortionEditSheet } from '../components/PortionEditSheet';
import { CATEGORY_ORDER, FOODS, FoodCategory, searchFoods } from '../data/foods';
import { curatedFood, searchDatabaseFoods } from '../lib/foodSearch';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { foodItem, perUnitOf, repeatItem, useAppState } from '../state/AppStateContext';
import { LoggedItem, MealType, ScanFood } from '../state/types';
import { useTheme } from '../theme/ThemeContext';
import { guessMealTypeForHour } from '../utils/date';
import { newId } from '../utils/id';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ route, navigation }: Props) {
  const { colors, mode } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const { logs, addItems } = useAppState();
  const mealType: MealType = route.params?.mealType ?? guessMealTypeForHour(new Date().getHours());

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | null>(null);
  const [pickedFood, setPickedFood] = useState<LoggedItem | null>(null);
  const [customVisible, setCustomVisible] = useState(false);
  const [remote, setRemote] = useState<{ q: string; foods: ScanFood[] } | null>(null);
  const trimmed = query.trim();

  // Recent/frequent come from the log itself, so they work for any food, not just curated dishes.
  const { recent, frequent } = useMemo(() => {
    const counts = new Map<string, number>();
    const latest = new Map<string, LoggedItem>();
    const days = Object.values(logs).sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const day of days) {
      for (const items of Object.values(day.meals)) {
        for (const it of items) {
          if (it.foodId === 'custom') continue;
          counts.set(it.foodId, (counts.get(it.foodId) || 0) + 1);
          if (!latest.has(it.foodId)) latest.set(it.foodId, it);
        }
      }
    }
    const frequentIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id);
    return {
      recent: [...latest.values()].slice(0, 6),
      frequent: frequentIds.map((id) => latest.get(id)!),
    };
  }, [logs]);

  // Curated dishes are bundled and searched instantly; the full BFCT/USDA database is queried remotely.
  useEffect(() => {
    if (trimmed.length < 2 || category) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchDatabaseFoods(trimmed)
        .then((foods) => !cancelled && setRemote({ q: trimmed, foods }))
        .catch((e) => {
          console.warn('food search failed', e);
          if (!cancelled) setRemote({ q: trimmed, foods: [] });
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, category]);

  const searching = trimmed.length >= 2 && !category && remote?.q !== trimmed;

  const results = useMemo(() => {
    if (!trimmed && !category) return [];
    let local = trimmed ? searchFoods(trimmed) : FOODS;
    if (category) local = local.filter((f) => f.category === category);
    const list = local.map(curatedFood);
    if (!category && remote?.q === trimmed) list.push(...remote.foods);
    return list;
  }, [trimmed, category, remote]);

  const showBrowsePrompt = !trimmed && !category;
  const noResults = (trimmed || category) && results.length === 0 && !searching;

  const catLabels: Record<FoodCategory, string> = {
    rice: t.cat[0], dal: t.cat[1], bhorta: t.cat[2], fish: t.cat[3], meat: t.cat[4],
    vegetables: t.cat[5], snacks: t.cat[6], sweets: t.cat[7], drinks: t.cat[8], packaged: t.cat[9],
  };

  const quickAdd = (item: LoggedItem) => {
    addItems(mealType, [repeatItem(item)]);
    goBackOrHome();
  };

  const goBackOrHome = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
        <Pressable onPress={goBackOrHome} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingHorizontal: 14, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.accent, borderRadius: 12 }}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchPh}
            placeholderTextColor={colors.muted}
            autoFocus
            style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, padding: 0 }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {showBrowsePrompt && frequent.length > 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <SectionLabel>{t.frequent}</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
              {frequent.map((it) => (
                <Chip key={it.foodId} label={`${lang === 'en' ? it.en : it.bn} · 1 ${lang === 'en' ? it.unitEn : it.unitBn}`} tone="accent" trailing={String(Math.round(perUnitOf(it).kcal))} onPress={() => quickAdd(it)} />
              ))}
            </View>
          </View>
        ) : null}

        {showBrowsePrompt && recent.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <SectionLabel>{t.recent}</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
              {recent.map((it) => (
                <Chip key={it.foodId} label={`${lang === 'en' ? it.en : it.bn} · 1 ${lang === 'en' ? it.unitEn : it.unitBn}`} onPress={() => quickAdd(it)} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: showBrowsePrompt ? 18 : 4 }}>
          <SectionLabel style={{ paddingHorizontal: 20 }}>{t.cats}</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, marginTop: 9 }}>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} label={catLabels[c]} selected={category === c} onPress={() => setCategory((cur) => (cur === c ? null : c))} />
            ))}
          </ScrollView>
        </View>

        {results.length > 0 ? (
          <View style={{ marginTop: 22, paddingHorizontal: 20 }}>
            <SectionLabel>{t.results}</SectionLabel>
            <View style={{ marginTop: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
              {results.map((f, idx) => (
                <Pressable
                  key={f.id}
                  onPress={() => setPickedFood(foodItem(f, 1))}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, minHeight: 48, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 15, fontWeight: '500', color: colors.ink }}>{lang === 'en' || !f.bn ? f.en : f.bn}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      {[lang === 'en' ? f.bn : f.bn ? f.en : null, `1 ${lang === 'en' ? f.unitEn : f.unitBn ?? f.unitEn}`].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, fontWeight: '600', color: colors.ink }}>{Math.round(f.kcalPerUnit)}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>kcal</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {searching ? <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} /> : null}

        {noResults ? (
          <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{t.noResults}</Text>
              <Text style={{ fontSize: 15, color: colors.muted, marginTop: 6, lineHeight: 15 * fonts.lineHeightMultiplier }}>{t.noResultsBody}</Text>
              <PrimaryButton label={t.addCustom} onPress={() => setCustomVisible(true)} style={{ marginTop: 14 }} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <PortionEditSheet
        item={pickedFood}
        onClose={() => setPickedFood(null)}
        onSave={(qty) => {
          if (!pickedFood) return;
          addItems(mealType, [{ ...pickedFood, qty }]);
          setPickedFood(null);
          goBackOrHome();
        }}
      />

      <CustomFoodSheet
        visible={customVisible}
        onClose={() => setCustomVisible(false)}
        onAdd={(name, kcal) => {
          addItems(mealType, [
            {
              id: newId(),
              foodId: 'custom',
              bn: name,
              en: name,
              unitEn: 'serving',
              unitBn: 'পরিবেশন',
              qty: 1,
              kcal,
              proteinG: 0,
              carbsG: 0,
              fatG: 0,
              gi: null,
            },
          ]);
          setCustomVisible(false);
          goBackOrHome();
        }}
      />
    </SafeAreaView>
  );
}

function SectionLabel({ children, style }: { children: string; style?: any }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Text style={[{ fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.muted, letterSpacing: 0.3, textTransform: 'uppercase' }, style]}>
      {children}
    </Text>
  );
}

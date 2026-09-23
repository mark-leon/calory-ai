import { useNetInfo } from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashedSlotButton } from '../components/Buttons';
import { CalorieRing } from '../components/CalorieRing';
import { Card, OfflineBanner, Toast } from '../components/Cards';
import { FoodRow } from '../components/FoodRow';
import { Icon } from '../components/Icon';
import { MacroBar } from '../components/MacroBar';
import { PortionEditSheet } from '../components/PortionEditSheet';
import { SkeletonBlock } from '../components/Skeleton';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppState } from '../state/AppStateContext';
import { LoggedItem, MEAL_TYPES, MealType } from '../state/types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';
import { formatFullDate, greetingForHour } from '../utils/date';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const MEAL_LABEL_KEY: Record<MealType, 'breakfast' | 'lunch' | 'snacks' | 'dinner'> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  snack: 'snacks',
  dinner: 'dinner',
};

export default function HomeScreen() {
  const { colors, mode } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const netInfo = useNetInfo();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    ready, name, dailyTarget, macroGoals, diabetic, todayKey, logs, todayTotals,
    removeItem, updateItemQty, deletePending, undoDelete, streak,
  } = useAppState();

  const [editingItem, setEditingItem] = useState<{ mealType: MealType; item: LoggedItem } | null>(null);

  const offline = netInfo.isConnected === false;
  const today = logs[todayKey];
  const hasAnyItems = today ? Object.values(today.meals).some((arr) => arr.length > 0) : false;
  const over = todayTotals.kcal > dailyTarget;

  const macros = [
    { key: 'protein', name: t.protein, have: todayTotals.proteinG, goal: macroGoals.protein, color: colors.success, gi: undefined },
    { key: 'carbs', name: t.carbs, have: todayTotals.carbsG, goal: macroGoals.carbs, color: colors.accent, gi: diabetic ? ('medium' as const) : undefined },
    { key: 'fat', name: t.fat, have: todayTotals.fatG, goal: macroGoals.fat, color: colors.warn, gi: undefined },
  ];
  const orderedMacros = diabetic ? [macros[1], macros[0], macros[2]] : macros;

  const greeting = `${greetingForHour(new Date().getHours(), lang)}${name ? `, ${name}` : ''}`;
  const dateStr = formatFullDate(new Date(), lang);

  const goToAddFood = (mealType: MealType) => {
    rootNav.navigate('Search', { mealType });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {offline ? <OfflineBanner /> : null}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: 6, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', letterSpacing: -0.2, color: colors.ink, lineHeight: 20 * fonts.lineHeightMultiplier }}>
            {greeting}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{dateStr}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.accentSoft, marginTop: 2 }}>
          <Icon name="flame" size={15} color={colors.accent} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent, fontVariant: ['tabular-nums'] }}>
            {streak} {t.streak}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Card style={{ paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <CalorieRing eaten={todayTotals.kcal} target={dailyTarget} over={over} />
            <View style={{ flex: 1, gap: 10 }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.muted }}>{t.eaten}</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, color: colors.ink }}>
                  {todayTotals.kcal.toLocaleString('en-US')} <Text style={{ fontSize: 13, fontWeight: '500', color: colors.muted }}>kcal</Text>
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View>
                <Text style={{ fontSize: 13, color: colors.muted }}>{t.target}</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, color: colors.ink }}>
                  {dailyTarget.toLocaleString('en-US')} <Text style={{ fontSize: 13, fontWeight: '500', color: colors.muted }}>kcal</Text>
                </Text>
              </View>
            </View>
          </View>
          {over ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, padding: 9, paddingHorizontal: 12, backgroundColor: colors.warnSoft, borderRadius: 12 }}>
              <Icon name="warning-triangle" size={16} color={colors.warn} />
              <Text style={{ fontSize: 13, color: colors.ink, flex: 1 }}>{t.overLine(todayTotals.kcal - dailyTarget)}</Text>
            </View>
          ) : null}
        </Card>

        <Card style={{ gap: 14 }}>
          {orderedMacros.map((m) => (
            <MacroBar key={m.key} name={m.name} have={m.have} goal={m.goal} color={m.color} large={m.key === 'carbs' && diabetic} gi={m.gi} />
          ))}
        </Card>

        {!ready ? (
          <View style={{ gap: 14 }}>
            <SkeletonBlock width={120} height={14} />
            <SkeletonBlock width="100%" height={72} />
            <SkeletonBlock width="100%" height={72} delay={150} />
          </View>
        ) : !hasAnyItems ? (
          <View style={{ padding: 28, paddingHorizontal: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink, textAlign: 'center' }}>{t.emptyTitle}</Text>
            <Text style={{ fontSize: 15, color: colors.muted, marginTop: 6, textAlign: 'center' }}>{t.emptyLine}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <Icon name="arrow-up" size={18} color={colors.accent} />
              <Text style={{ fontSize: 13, color: colors.muted }}>{t.emptyHint}</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 18 }}>
            {MEAL_TYPES.map((mealType) => {
              const items = today?.meals[mealType] || [];
              const kcal = items.reduce((n, it) => n + it.kcal, 0);
              return (
                <View key={mealType}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink }}>
                      {t[MEAL_LABEL_KEY[mealType]]}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] }}>
                      {items.length ? `${kcal} kcal` : '—'}
                    </Text>
                  </View>
                  {items.length ? (
                    <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }}>
                      {items.map((item, idx) => (
                        <View key={item.id}>
                          {idx > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 70 }} /> : null}
                          <FoodRow
                            item={item}
                            onDelete={() => removeItem(mealType, item.id)}
                            onLongPress={() => setEditingItem({ mealType, item })}
                          />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <DashedSlotButton label={`+ ${t.addFood}`} onPress={() => goToAddFood(mealType)} />
                  )}
                  {items.length ? (
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 7, paddingLeft: 2 }}>{t.swipeHint}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {deletePending ? <Toast message={t.toastDeleted} actionLabel={t.undo} onAction={undoDelete} /> : null}

      <PortionEditSheet
        item={editingItem?.item ?? null}
        onClose={() => setEditingItem(null)}
        onSave={(qty) => {
          if (!editingItem) return;
          updateItemQty(editingItem.mealType, editingItem.item.id, qty);
          setEditingItem(null);
        }}
      />
    </SafeAreaView>
  );
}

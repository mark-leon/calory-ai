import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberField } from '../components/FieldBox';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { SettingsGroup, SettingsRow } from '../components/SettingsRow';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { totalsForDay, useAppState } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/tokens';

export default function ProfileScreen() {
  const { colors, mode, followSystem, setDarkMode } = useTheme();
  const { lang, t, fonts, toggleLang } = useLanguage();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    name, dailyTarget, todayKey, logs, streak, subscription, settings,
    toggleReminders, setTargetOverride, resetAllData, resetOnboarding,
  } = useAppState();
  const { session, signOut } = useAuth();

  const [editTargetVisible, setEditTargetVisible] = useState(false);
  const [draftTarget, setDraftTarget] = useState(dailyTarget);

  const initial = (name.trim()[0] || (lang === 'en' ? 'U' : 'ব')).toUpperCase();
  const subLabel =
    subscription.tier === 'free' ? t.subFree : subscription.tier === 'monthly' ? t.subPaidMonthly : t.subPaidYearly;

  const exportData = async () => {
    const today = totalsForDay(logs[todayKey]);
    const summary =
      lang === 'en'
        ? `Calories export\nStreak: ${streak} days\nToday: ${today.kcal} kcal (target ${dailyTarget})\nProtein ${today.proteinG}g · Carbs ${today.carbsG}g · Fat ${today.fatG}g`
        : `ক্যালরি এক্সপোর্ট\nস্ট্রিক: ${streak} দিন\nআজ: ${today.kcal} kcal (লক্ষ্য ${dailyTarget})\nপ্রোটিন ${today.proteinG}g · কার্ব ${today.carbsG}g · ফ্যাট ${today.fatG}g`;
    try {
      await Share.share({ message: summary });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t.sDelete,
      lang === 'en' ? 'This clears everything stored on this device. This cannot be undone.' : 'এতে এই ডিভাইসে রাখা সব তথ্য মুছে যাবে। এটি ফেরানো যাবে না।',
      [
        { text: t.cancelWord, style: 'cancel' },
        {
          text: t.sDelete,
          style: 'destructive',
          onPress: () => {
            resetAllData();
            resetOnboarding();
          },
        },
      ]
    );
  };

  const confirmSignOut = () => {
    Alert.alert(t.sSignOut, t.signOutBody, [
      { text: t.cancelWord, style: 'cancel' },
      {
        text: t.sSignOut,
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            console.warn('signOut failed', e);
          }
          // local data belongs to the previous user; don't show it to the next one
          resetAllData();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.accent }}>{initial}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{name || t.tabProfile}</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{session?.user.email ?? subLabel}</Text>
          </View>
        </View>

        <SettingsGroup title={t.profTargets}>
          <SettingsRow label={t.sTarget} value={`${dailyTarget.toLocaleString('en-US')} kcal`} onPress={() => { setDraftTarget(dailyTarget); setEditTargetVisible(true); }} />
          <SettingsRow label={t.sMacro} value="20 / 50 / 30" divider />
          <SettingsRow label={t.sUnits} value={t.unitsVal} divider />
        </SettingsGroup>

        <SettingsGroup title={t.profApp}>
          <SettingsRow label={t.sLang} value={t.langVal} onPress={toggleLang} />
          <SettingsRow label={t.sDark} toggle={!followSystem && mode === 'dark'} onToggle={(v) => setDarkMode(v)} divider />
          <SettingsRow label={t.sRemind} value={settings.remindersOn ? t.remindOn : t.no} toggle={settings.remindersOn} onToggle={toggleReminders} divider />
        </SettingsGroup>

        <SettingsGroup title={t.profAccount}>
          <SettingsRow label={t.sSub} value={subLabel} onPress={() => subscription.tier === 'free' && rootNav.navigate('Paywall')} />
          <SettingsRow label={t.sExport} onPress={exportData} divider />
          <SettingsRow
            label={t.sSupport}
            onPress={() => Alert.alert(t.sSupport, lang === 'en' ? "Support chat isn't available in this preview build." : 'সহায়তা চ্যাট এই প্রিভিউ সংস্করণে নেই।')}
            divider
          />
          <SettingsRow label={t.sSignOut} onPress={confirmSignOut} divider />
          <SettingsRow label={t.sDelete} color={colors.accent} onPress={confirmDelete} divider />
        </SettingsGroup>
      </ScrollView>

      <Modal visible={editTargetVisible} transparent animationType="fade" onRequestClose={() => setEditTargetVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setEditTargetVisible(false)} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card }}>
          <SafeAreaView edges={['bottom']}>
            <View style={{ padding: spacing.xl, gap: spacing.lg }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{t.sTarget}</Text>
              <NumberField value={draftTarget} onChangeValue={(n) => setDraftTarget(Math.max(800, Math.round(n)))} unit="kcal" />
              <PrimaryButton
                label={t.done}
                onPress={() => {
                  setTargetOverride(draftTarget);
                  setEditTargetVisible(false);
                }}
              />
              <SecondaryButton
                label={lang === 'en' ? 'Use calculated target' : 'হিসাব করা লক্ষ্য ব্যবহার করুন'}
                onPress={() => {
                  setTargetOverride(null);
                  setEditTargetVisible(false);
                }}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

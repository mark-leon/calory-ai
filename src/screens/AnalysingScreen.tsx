import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SecondaryButton } from '../components/Buttons';
import { useLanguage } from '../i18n/LanguageContext';
import { analyzeMeal } from '../lib/scan';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Analysing'>;

export default function AnalysingScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const { setScansUsedToday } = useAppState();
  const spin = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    const sweepLoop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 2200, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }));
    spinLoop.start();
    sweepLoop.start();

    // Cancel just stops us navigating; the request itself still finishes server-side.
    let cancelled = false;
    analyzeMeal(photoUri).then((outcome) => {
      if (cancelled) return;
      if (outcome.status !== 'error') setScansUsedToday(outcome.scansUsedToday);
      if (outcome.status === 'ok') navigation.replace('ScanResult', { photoUri, items: outcome.items });
      else if (outcome.status === 'quota_exceeded') navigation.replace('Paywall');
      else navigation.replace('ScanResult', { photoUri, failed: true });
    });

    return () => {
      cancelled = true;
      spinLoop.stop();
      sweepLoop.stop();
    };
  }, []);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const sweepY = sweep.interpolate({ inputRange: [0, 1], outputRange: [-180, 844] });

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0D0A' }}>
      <StatusBar style="light" />
      <Image source={{ uri: photoUri }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} resizeMode="cover" />
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,18,14,0.55)' }} />
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 180, transform: [{ translateY: sweepY }] }}>
        <LinearGradient
          colors={['rgba(217,102,63,0)', 'rgba(217,102,63,0.22)', 'rgba(217,102,63,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <SafeAreaView style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 34, gap: 26 }} edges={['bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Animated.View
            style={{
              width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', borderTopColor: colors.accent,
              transform: [{ rotate: spinDeg }],
            }}
          />
          <View>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: '#fff', lineHeight: 20 * fonts.lineHeightMultiplier }}>{t.analysing1}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2, lineHeight: 19 }}>{t.analysing2}</Text>
          </View>
        </View>
        <SecondaryButton
          label={t.cancel}
          onPress={() => navigation.navigate('Main')}
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.22)' }}
          textColor="#fff"
        />
      </SafeAreaView>
    </View>
  );
}

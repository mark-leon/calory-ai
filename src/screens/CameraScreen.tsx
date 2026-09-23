import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton, TextLink } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { StripePlaceholder } from '../components/StripePlaceholder';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export default function CameraScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const { scansLeftToday, canScan, useScan } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!canScan()) {
      navigation.replace('Paywall');
    }
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const shoot = async () => {
    if (!cameraRef.current || !ready) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    useScan();
    navigation.replace('Analysing', { photoUri: photo.uri });
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      useScan();
      navigation.replace('Analysing', { photoUri: result.assets[0].uri });
    }
  };

  const denied = permission ? !permission.granted && !permission.canAskAgain : false;

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0D0A' }}>
      <StatusBar style="light" />
      {!denied && permission?.granted ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash} onCameraReady={() => setReady(true)} />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#141210' }} />
      )}

      {!denied ? (
        <View style={{ position: 'absolute', inset: 0 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x-close" size={22} color="#fff" />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' }}>
                <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.warn }} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff', fontVariant: ['tabular-nums'] }}>{t.scansLeft(scansLeftToday)}</Text>
              </View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 266, height: 266 }}>
                <Corner style={{ left: 0, top: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderTopLeftRadius: 6 }} />
                <Corner style={{ right: 0, top: 0, borderRightWidth: 1.5, borderTopWidth: 1.5, borderTopRightRadius: 6 }} />
                <Corner style={{ left: 0, bottom: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderBottomLeftRadius: 6 }} />
                <Corner style={{ right: 0, bottom: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderBottomRightRadius: 6 }} />
                <Text
                  style={{
                    position: 'absolute', left: '50%', bottom: -42, transform: [{ translateX: -85 }], width: 170, textAlign: 'center',
                    fontFamily: fonts.regular, fontSize: 15, lineHeight: 15 * fonts.lineHeightMultiplier, color: 'rgba(255,255,255,0.86)',
                  }}
                >
                  {t.frameHint}
                </Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 26, alignItems: 'center', gap: 20 }}>
              <TextLink label={t.typeInstead} color="#fff" onPress={() => navigation.replace('Search')} />
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={pickFromGallery} style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', overflow: 'hidden' }}>
                  <StripePlaceholder width={48} height={48} radius={0} />
                </Pressable>
                <Pressable
                  onPress={shoot}
                  style={({ pressed }) => [
                    { width: 78, height: 78, borderRadius: 999, backgroundColor: colors.accent, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Icon name="camera" size={30} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={() => setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))}
                  style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="flash" size={24} color={flash === 'off' ? '#fff' : colors.accent} />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(14,13,10,0.92)', justifyContent: 'flex-end', padding: 20 }}>
          <SafeAreaView edges={['bottom']}>
            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="camera-off" size={24} color={colors.warn} />
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.ink }}>{t.permTitle}</Text>
              </View>
              <Text style={{ marginTop: 10, fontSize: 15, color: colors.muted, lineHeight: 15 * fonts.lineHeightMultiplier }}>{t.permBody}</Text>
              <PrimaryButton label={t.openSettings} onPress={() => Linking.openSettings()} style={{ marginTop: 16 }} />
              <SecondaryButton label={t.typeInstead} onPress={() => navigation.replace('Search')} style={{ marginTop: 8, borderWidth: 0 }} />
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

function Corner({ style }: { style: any }) {
  return <View style={[{ position: 'absolute', width: 34, height: 34, borderColor: 'rgba(255,255,255,0.9)' }, style]} />;
}

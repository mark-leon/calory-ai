import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, TextLink } from '../components/Buttons';
import { TextField } from '../components/FieldBox';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { colors, mode } = useTheme();
  const { lang, t, fonts, toggleLang } = useLanguage();
  const { sendCode, verifyCode } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim().toLowerCase();

  const onSend = async () => {
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t.authBadEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendCode(trimmedEmail);
      setCode('');
      setStep('code');
    } catch (e) {
      console.warn('sendCode failed', e);
      setError(t.authFailed);
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setBusy(true);
    setError(null);
    try {
      // On success AuthContext picks up the session and the navigator moves on.
      await verifyCode(trimmedEmail, code);
    } catch (e) {
      console.warn('verifyCode failed', e);
      setError(t.authBadCode);
      setBusy(false);
    }
  };

  const title = step === 'email' ? t.authTitle : t.authCodeTitle;
  const body = step === 'email' ? t.authBody : t.authCodeBody(trimmedEmail);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <Pressable onPress={toggleLang} hitSlop={8}>
            <Text style={{ fontFamily: lang === 'bn' ? 'Inter_500Medium' : 'NotoSansBengali_500Medium', fontSize: 14, color: colors.muted }}>
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxl }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.ink, lineHeight: 28 * fonts.lineHeightMultiplier }}>
            {title}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.muted, marginTop: 10, lineHeight: 15 * fonts.lineHeightMultiplier }}>
            {body}
          </Text>

          <View style={{ marginTop: 24 }}>
            {step === 'email' ? (
              <TextField
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder={t.authEmailPh}
                inputProps={{
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                  autoCorrect: false,
                  autoComplete: 'email',
                  textContentType: 'emailAddress',
                  autoFocus: true,
                  returnKeyType: 'send',
                  onSubmitEditing: onSend,
                }}
              />
            ) : (
              <TextField
                value={code}
                onChangeText={(v) => { setCode(v.replace(/\D/g, '')); setError(null); }}
                placeholder="123456"
                inputProps={{
                  keyboardType: 'number-pad',
                  autoComplete: 'one-time-code',
                  textContentType: 'oneTimeCode',
                  maxLength: 8,
                  autoFocus: true,
                }}
              />
            )}
            {error ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.accent, marginTop: 8 }}>{error}</Text>
            ) : null}
          </View>

          {step === 'code' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TextLink label={t.authChangeEmail} color={colors.muted} onPress={() => { setStep('email'); setError(null); }} />
              <TextLink label={t.authResend} onPress={busy ? undefined : onSend} />
            </View>
          ) : null}
        </ScrollView>
        <View style={{ padding: spacing.xl, paddingTop: spacing.md }}>
          {step === 'email' ? (
            <PrimaryButton label={t.authSendCode} onPress={onSend} loading={busy} disabled={!trimmedEmail} />
          ) : (
            <PrimaryButton label={t.authVerify} onPress={onVerify} loading={busy} disabled={code.length < 6} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

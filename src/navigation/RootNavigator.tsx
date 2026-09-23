import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../state/AuthContext';
import { useAppState } from '../state/AppStateContext';
import { OnboardingDraftProvider } from '../state/OnboardingDraftContext';
import AnalysingScreen from '../screens/AnalysingScreen';
import CameraScreen from '../screens/CameraScreen';
import OnbActivityScreen from '../screens/onboarding/OnbActivityScreen';
import OnbBodyScreen from '../screens/onboarding/OnbBodyScreen';
import OnbGoalScreen from '../screens/onboarding/OnbGoalScreen';
import OnbHealthScreen from '../screens/onboarding/OnbHealthScreen';
import OnbResultScreen from '../screens/onboarding/OnbResultScreen';
import PaywallScreen from '../screens/PaywallScreen';
import ScanResultScreen from '../screens/ScanResultScreen';
import SearchScreen from '../screens/SearchScreen';
import SignInScreen from '../screens/SignInScreen';
import { useTheme } from '../theme/ThemeContext';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { onboarded, profileSynced } = useAppState();
  const { session } = useAuth();
  const { colors } = useTheme();

  // Signed in but the profile hasn't loaded yet: wait, so a returning user on a new
  // device doesn't get flashed the onboarding flow.
  if (session && !profileSynced) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <OnboardingDraftProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : !onboarded ? (
            <>
              <Stack.Screen name="OnbGoal" component={OnbGoalScreen} />
              <Stack.Screen name="OnbBody" component={OnbBodyScreen} />
              <Stack.Screen name="OnbActivity" component={OnbActivityScreen} />
              <Stack.Screen name="OnbHealth" component={OnbHealthScreen} />
              <Stack.Screen name="OnbResult" component={OnbResultScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Camera" component={CameraScreen} options={{ animation: 'fade' }} />
              <Stack.Screen name="Analysing" component={AnalysingScreen} />
              <Stack.Screen name="ScanResult" component={ScanResultScreen} />
              <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
            </>
          )}
        </Stack.Navigator>
      </OnboardingDraftProvider>
    </NavigationContainer>
  );
}

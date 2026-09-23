import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../components/Icon';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeContext';
import { hexToRgba } from '../theme/tokens';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const insets = useSafeAreaInsets();
  const { canScan } = useAppState();
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>() ?? navigation;

  const tabs: { key: string; route: keyof MainTabParamList; icon: IconName; label: string }[] = [
    { key: 'home', route: 'Home', icon: 'home', label: t.tabHome },
    { key: 'progress', route: 'Progress', icon: 'bars', label: t.tabProgress },
    { key: 'profile', route: 'Profile', icon: 'user', label: t.tabProfile },
  ];
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, position: 'relative' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 10, paddingBottom: insets.bottom || 10 }}>
        {tabs.slice(0, 1).map((tabDef) => renderTab(tabDef))}
        <View style={{ width: 74 }} />
        {tabs.slice(1).map((tabDef) => renderTab(tabDef))}
      </View>
      <Pressable
        onPress={() => {
          if (canScan()) rootNav.navigate('Camera');
          else rootNav.navigate('Paywall');
        }}
        style={({ pressed }) => [
          {
            position: 'absolute',
            left: '50%',
            top: -30,
            marginLeft: -34,
            width: 68,
            height: 68,
            borderRadius: 999,
            backgroundColor: colors.accent,
            borderWidth: 4,
            borderColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${hexToRgba(colors.accent, 0.32)}`,
            elevation: 4,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Icon name="camera" size={30} color="#fff" />
      </Pressable>
    </View>
  );

  function renderTab({ route, icon, label }: { route: keyof MainTabParamList; icon: IconName; label: string }) {
    const focused = activeRouteName === route;
    const color = focused ? colors.accent : colors.muted;
    return (
      <Pressable
        key={route}
        onPress={() => navigation.navigate(route)}
        style={{ width: 74, alignItems: 'center', gap: 4, paddingVertical: 6 }}
      >
        <Icon name={icon} size={24} color={color} />
        <Text style={{ fontFamily: fonts.medium, fontSize: 13, fontWeight: '500', color, lineHeight: 16 }}>{label}</Text>
      </Pressable>
    );
  }
}

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

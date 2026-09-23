import type { MealType, ScanItem } from '../state/types';

export type RootStackParamList = {
  SignIn: undefined;
  OnbGoal: undefined;
  OnbBody: undefined;
  OnbActivity: undefined;
  OnbHealth: undefined;
  OnbResult: undefined;
  Main: undefined;
  Camera: undefined;
  Analysing: { photoUri: string };
  ScanResult: { photoUri: string; items?: ScanItem[]; failed?: boolean };
  Search: { mealType?: MealType } | undefined;
  Paywall: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Progress: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

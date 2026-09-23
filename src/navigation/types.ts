import type { MealType } from '../state/types';

export type RootStackParamList = {
  OnbGoal: undefined;
  OnbBody: undefined;
  OnbActivity: undefined;
  OnbHealth: undefined;
  OnbResult: undefined;
  Main: undefined;
  Camera: undefined;
  Analysing: { photoUri: string };
  ScanResult: { photoUri: string; failed?: boolean };
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

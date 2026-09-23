import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { TextLink } from '../components/Buttons';
import { Card, StatTile } from '../components/Cards';
import { Icon } from '../components/Icon';
import { SegmentedControl } from '../components/Chip';
import { SkeletonBlock } from '../components/Skeleton';
import { WeightEntrySheet } from '../components/WeightEntrySheet';
import { useLanguage } from '../i18n/LanguageContext';
import { totalsForDay, useAppState } from '../state/AppStateContext';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';
import { dateKey, last7Days, lastNWeeks, weekdayShort } from '../utils/date';

export default function ProgressScreen() {
  const { colors, mode } = useTheme();
  const { lang, t, fonts } = useLanguage();
  const { logs, dailyTarget, diabetic, streak, weightHistory, addWeight } = useAppState();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [addWeightVisible, setAddWeightVisible] = useState(false);

  const days = useMemo(() => last7Days(), []);
  const dayTotals = days.map((d) => totalsForDay(logs[dateKey(d)]));

  const weekBuckets = useMemo(() => lastNWeeks(4), []);
  const weekTotals = weekBuckets.map((bucket) => {
    const perDay = bucket.map((d) => totalsForDay(logs[dateKey(d)]));
    return {
      kcal: perDay.reduce((n, d) => n + d.kcal, 0),
      carbsG: perDay.reduce((n, d) => n + d.carbsG, 0),
      daysLogged: perDay.filter((d) => d.kcal > 0).length,
    };
  });

  const daysWithData = Object.values(logs).filter((d) => totalsForDay(d).kcal > 0).length;
  const hasEnoughData = daysWithData >= 3;
  const isWeek = range === 'week';

  const bars = isWeek
    ? dayTotals.map((d, i) => ({ value: d.kcal, over: d.kcal > dailyTarget, label: weekdayShort(days[i], lang), faint: i === dayTotals.length - 1 && d.kcal === 0 }))
    : weekTotals.map((w, i) => ({ value: w.kcal, over: w.daysLogged > 0 && w.kcal > dailyTarget * 7, label: `${lang === 'en' ? 'W' : 'সপ্তাহ '}${i + 1}`, faint: w.daysLogged === 0 }));
  const targetLine = isWeek ? dailyTarget : dailyTarget * 7;

  const maxBar = Math.max(targetLine * 1.15, ...bars.map((b) => b.value));
  const targetLineFromBottom = (targetLine / maxBar) * 150;

  const avgKcal = dayTotals.length ? Math.round(dayTotals.reduce((n, d) => n + d.kcal, 0) / (dayTotals.filter((d) => d.kcal > 0).length || 1)) : 0;
  const daysOnTarget = dayTotals.filter((d) => d.kcal > 0 && d.kcal <= dailyTarget).length;
  const avgCarbs = Math.round(
    dayTotals.filter((d) => d.kcal > 0).reduce((n, d) => n + d.carbsG, 0) / (dayTotals.filter((d) => d.kcal > 0).length || 1)
  );

  const sortedWeights = [...weightHistory].sort((a, b) => (a.date < b.date ? -1 : 1));
  const latestWeight = sortedWeights[sortedWeights.length - 1];
  const prevWeight = sortedWeights[sortedWeights.length - 2];
  const weightDelta = latestWeight && prevWeight ? Math.round((latestWeight.kg - prevWeight.kg) * 10) / 10 : 0;
  const weightDown = weightDelta <= 0;

  const sparkPoints = useMemo(() => {
    if (sortedWeights.length < 2) return '';
    const values = sortedWeights.map((w) => w.kg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range2 = max - min || 1;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 300;
        const y = 10 + ((max - v) / range2) * 50;
        return `${x},${y}`;
      })
      .join(' ');
  }, [sortedWeights]);
  const lastSpark = sparkPoints.split(' ').pop();
  const [lastX, lastY] = (lastSpark || '300,48').split(',').map(Number);

  const tiles = diabetic
    ? [
        { value: avgKcal.toLocaleString('en-US'), label: t.tAvg },
        { value: String(daysOnTarget), label: t.tOnTarget },
        { value: String(streak), label: t.tStreak },
        { value: `${avgCarbs} g`, label: t.tCarbs },
      ]
    : [
        { value: avgKcal.toLocaleString('en-US'), label: t.tAvg },
        { value: String(daysOnTarget), label: t.tOnTarget },
        { value: String(streak), label: t.tStreak },
        { value: latestWeight ? `${latestWeight.kg} ${t.kg}` : '—', label: t.weightTrend },
      ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: 6 }}>
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', letterSpacing: -0.2, color: colors.ink }}>{t.tabProgress}</Text>
        <View style={{ marginTop: 12 }}>
          <SegmentedControl
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: t.week },
              { value: 'month', label: t.month },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120, gap: 14 }}>
        {!hasEnoughData ? (
          <Card>
            <View style={{ height: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 122, borderTopWidth: 1.5, borderStyle: 'dashed', borderTopColor: colors.border }} />
              {[96, 60, 40, 40, 40, 40, 40].map((h, i) => (
                <SkeletonBlock key={i} width="100%" height={h} radius={6} delay={i * 60} style={{ flex: 1 }} />
              ))}
            </View>
            <Text style={{ marginTop: 16, fontSize: 15, color: colors.muted, lineHeight: 15 * fonts.lineHeightMultiplier }}>
              {t.progEmptyLine(daysWithData)}
            </Text>
          </Card>
        ) : (
          <>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink }}>{t.kcalChart}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] }}>{t.targetDashed(targetLine.toLocaleString('en-US'))}</Text>
              </View>
              <View style={{ height: 150, marginTop: 14 }}>
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: targetLineFromBottom, borderTopWidth: 1.5, borderStyle: 'dashed', borderTopColor: colors.muted, opacity: 0.55 }} />
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                  {bars.map((b, i) => {
                    const h = Math.max(3, (b.value / maxBar) * 150);
                    return (
                      <View
                        key={i}
                        style={{ flex: 1, height: h, backgroundColor: b.over ? colors.warn : colors.accent, borderRadius: 6, opacity: b.faint ? 0.3 : 1 }}
                      />
                    );
                  })}
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
                {bars.map((b, i) => (
                  <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.muted }}>
                    {b.label}
                  </Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Legend color={colors.accent} label={t.tOnTarget} />
                <Legend color={colors.warn} label={t.overWord} />
              </View>
            </Card>

            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.ink }}>{t.weightTrend}</Text>
                <TextLink label={`+ ${t.addWeight}`} onPress={() => setAddWeightVisible(true)} />
              </View>
              {latestWeight ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 28, fontWeight: '600', letterSpacing: -0.6, color: colors.ink }}>{latestWeight.kg}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.muted }}>{t.kg}</Text>
                    {prevWeight ? (
                      <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Icon name={weightDown ? 'arrow-down' : 'arrow-up'} size={15} color={weightDown ? colors.success : colors.warn} />
                        <Text style={{ fontSize: 13, color: weightDown ? colors.success : colors.warn, fontVariant: ['tabular-nums'] }}>
                          {Math.abs(weightDelta)} {t.kg}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {sparkPoints ? (
                    <Svg width="100%" height={70} viewBox="0 0 300 70" style={{ marginTop: 10 }}>
                      <Polyline points={sparkPoints} fill="none" stroke={colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <Circle cx={lastX} cy={lastY} r={3.5} fill={colors.success} />
                    </Svg>
                  ) : null}
                </>
              ) : null}
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {tiles.map((tl, i) => (
                <View key={i} style={{ width: '47.5%' }}>
                  <StatTile value={tl.value} label={tl.label} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <WeightEntrySheet visible={addWeightVisible} initialKg={latestWeight?.kg ?? 65} onClose={() => setAddWeightVisible(false)} onSave={(kg) => { addWeight(kg); setAddWeightVisible(false); }} />
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
    </View>
  );
}

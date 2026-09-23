const BN_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BN_WEEKDAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// English numerals throughout, including Bangla dates — per the design brief.
export function formatFullDate(date: Date, lang: 'bn' | 'en'): string {
  const weekday = lang === 'bn' ? BN_WEEKDAYS[date.getDay()] : EN_WEEKDAYS[date.getDay()];
  const month = lang === 'bn' ? BN_MONTHS[date.getMonth()] : EN_MONTHS[date.getMonth()];
  return lang === 'bn'
    ? `${weekday}, ${date.getDate()} ${month}`
    : `${weekday}, ${date.getDate()} ${month}`;
}

export function weekdayShort(date: Date, lang: 'bn' | 'en'): string {
  return lang === 'bn' ? BN_WEEKDAYS_SHORT[date.getDay()] : EN_WEEKDAYS_SHORT[date.getDay()];
}

export function greetingForHour(hour: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    if (hour < 12) return 'শুভ সকাল';
    if (hour < 17) return 'শুভ বিকাল';
    return 'শুভ সন্ধ্যা';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function guessMealTypeForHour(hour: number): 'breakfast' | 'lunch' | 'snack' | 'dinner' {
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'snack';
  return 'dinner';
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function last7Days(from: Date = new Date()): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

/** Last `weeks` 7-day buckets ending today, each as its list of dates (oldest first). */
export function lastNWeeks(weeks: number, from: Date = new Date()): Date[][] {
  const buckets: Date[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const bucket: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(from);
      d.setDate(d.getDate() - w * 7 - i);
      bucket.push(d);
    }
    buckets.push(bucket);
  }
  return buckets;
}

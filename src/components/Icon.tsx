import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Path data ported 1:1 from the approved Claude Design source (Screen.dc.html)
// so iconography matches exactly — single-weight outline, 1.5px stroke, per brief.
type IconShape = { paths?: string[]; circles?: { cx: number; cy: number; r: number }[] };

const ICONS: Record<string, IconShape> = {
  flame: { paths: ['M12 3c1.5 3.5-1 4.5-1 7a3.5 3.5 0 0 0 7 0c0-1-.3-2-1-3 3 2 4 4.5 4 7a7 7 0 0 1-14 0c0-4 2.5-7 5-11z'] },
  'warning-triangle': {
    paths: ['M12 9v4', 'M12 16.5h.01', 'M10.7 4.2 3.4 17a1.5 1.5 0 0 0 1.3 2.2h14.6a1.5 1.5 0 0 0 1.3-2.2L13.3 4.2a1.5 1.5 0 0 0-2.6 0z'],
  },
  'warning-circle': { paths: ['M12 8v4.5', 'M12 16h.01'], circles: [{ cx: 12, cy: 12, r: 8.5 }] },
  'arrow-up': { paths: ['M12 20v-9', 'm8 14 4-4 4 4'] },
  'arrow-down': { paths: ['M12 5v14', 'm6 13 6 6 6-6'] },
  'x-close': { paths: ['M6 6l12 12M18 6L6 18'] },
  'chevron-left': { paths: ['M15 5l-7 7 7 7'] },
  'chevron-right': { paths: ['M9 6l6 6-6 6'] },
  'chevron-down': { paths: ['M6 10l6 6 6-6'] },
  'chevron-up': { paths: ['M6 14l6-6 6 6'] },
  minus: { paths: ['M5 12h14'] },
  plus: { paths: ['M12 5v14', 'M5 12h14'] },
  camera: { paths: ['M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z'], circles: [{ cx: 12, cy: 13, r: 3.4 }] },
  'camera-off': { paths: ['M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z', 'M3 3l18 18'] },
  flash: { paths: ['M13 3 5.5 13.2h5L10 21l8.5-10.5h-5.2z'] },
  trash: { paths: ['M5 7h14', 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7', 'M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7'] },
  remove: { paths: ['M5 7h14', 'M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7'] },
  search: { paths: ['M16 16l4 4'], circles: [{ cx: 11, cy: 11, r: 6.5 }] },
  check: { paths: ['m5 12.5 4.5 4.5L19 7.5'] },
  home: { paths: ['M4 10.5 12 4l8 6.5', 'M6 9.8V19h12V9.8', 'M10 19v-5h4v5'] },
  bars: { paths: ['M5 19V9', 'M12 19V5', 'M19 19v-6'] },
  user: { paths: ['M5.5 19.5c.8-3.2 3.4-4.8 6.5-4.8s5.7 1.6 6.5 4.8'], circles: [{ cx: 12, cy: 9, r: 3.4 }] },
  'wifi-off': { paths: ['M2 4l20 20', 'M5 12.5a10 10 0 0 1 4-2.4', 'M12 19h.01', 'M15.5 15.5a5 5 0 0 0-3.2-1.5'] },
  info: { paths: ['M12 11v5', 'M12 8h.01'], circles: [{ cx: 12, cy: 12, r: 8.5 }] },
  image: { paths: [] },
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 24,
  color = '#1C1A17',
  strokeWidth = 1.5,
  filled,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}) {
  const shape = ICONS[name];
  if (!shape) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {shape.paths?.map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={filled ? color : 'none'} />
      ))}
      {shape.circles?.map((c, i) => (
        <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} stroke={color} strokeWidth={strokeWidth} fill={filled ? color : 'none'} />
      ))}
    </Svg>
  );
}

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

// Mirrors the design's repeating-linear-gradient stripe placeholder used for
// dish thumbnails and the camera feed mock — real meal photography wasn't
// part of this handoff (flagged as an open item in the design), so a photo
// substitutes this only where one was actually captured (camera / scan result).
export function StripePlaceholder({
  width,
  height,
  radius = 10,
  style,
}: {
  width: number;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const patternId = 'stripe-pattern';
  return (
    <Svg width={width} height={height} style={[{ borderRadius: radius, overflow: 'hidden' }, style] as any}>
      <Defs>
        <Pattern id={patternId} patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(45)">
          <Rect x={0} y={0} width={4} height={8} fill={colors.stripe} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={colors.skeleton} />
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${patternId})`} />
    </Svg>
  );
}

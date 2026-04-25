import React from 'react';
import Svg, { G, Ellipse, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  petal?: string;
  core?: string;
}

/**
 * The Indi-gen / LeadHangover flower mark — 8 petals around an orange core.
 * Mirror of landing/src/components/FlowerMark.tsx, ported to react-native-svg
 * so the mobile splash, tab bar, and detail header can render the same mark.
 */
export function FlowerMark({ size = 32, petal = '#0E0E0C', core = '#FF5A1F' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <G transform="translate(256 256)">
        <G fill={petal}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <Ellipse
              key={deg}
              cx={0}
              cy={-141}
              rx={36}
              ry={107}
              transform={`rotate(${deg})`}
            />
          ))}
        </G>
        <Circle cx={0} cy={0} r={26} fill={core} />
      </G>
    </Svg>
  );
}

export default FlowerMark;

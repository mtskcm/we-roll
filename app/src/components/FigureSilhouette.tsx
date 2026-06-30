// FigureSilhouette — a neutral front-facing mannequin drawn behind the garment
// cutouts so the dressed figure reads as a body, not floating clothes.

import React from 'react';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';

export function FigureSilhouette({
  width,
  height,
  color = '#2E2E36',
}: {
  width: number;
  height: number;
  color?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 280" preserveAspectRatio="xMidYMid meet">
      {/* head + neck */}
      <Circle cx={60} cy={28} r={19} fill={color} />
      <Rect x={51} y={43} width={18} height={13} fill={color} />
      {/* arms */}
      <Rect x={17} y={56} width={15} height={84} rx={7.5} fill={color} />
      <Rect x={88} y={56} width={15} height={84} rx={7.5} fill={color} />
      <Circle cx={24.5} cy={142} r={9} fill={color} />
      <Circle cx={95.5} cy={142} r={9} fill={color} />
      {/* torso */}
      <Rect x={33} y={52} width={54} height={94} rx={22} fill={color} />
      {/* legs */}
      <Rect x={37} y={140} width={19} height={128} rx={9} fill={color} />
      <Rect x={64} y={140} width={19} height={128} rx={9} fill={color} />
      {/* feet */}
      <Ellipse cx={46} cy={271} rx={13} ry={8} fill={color} />
      <Ellipse cx={74} cy={271} rx={13} ry={8} fill={color} />
    </Svg>
  );
}

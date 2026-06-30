// FigureSilhouette — a neutral front-facing mannequin drawn behind the garment
// cutouts so the dressed figure reads as a body. Male / female proportions.

import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export type FigureVariant = 'female' | 'male';

export function FigureSilhouette({
  width,
  height,
  variant = 'female',
  color = '#2E2E36',
}: {
  width: number;
  height: number;
  variant?: FigureVariant;
  color?: string;
}) {
  const male = variant === 'male';
  const C = 60; // centre x
  const shoulder = male ? 58 : 47;
  const waist = male ? 46 : 33;
  const hip = male ? 44 : 51;
  const headR = male ? 17 : 16;

  const sL = C - shoulder / 2, sR = C + shoulder / 2; // shoulders @ y52
  const wL = C - waist / 2, wR = C + waist / 2;        // waist @ y104
  const hL = C - hip / 2, hR = C + hip / 2;            // hips @ y150

  const torso = `M${sL},54 Q${sL - 3},78 ${wL},104 L${hL},150 L${hR},150 L${wR},104 Q${sR + 3},78 ${sR},54 Z`;

  const legGap = 4;
  const legLW = C - legGap / 2 - hL;
  const legRW = hR - (C + legGap / 2);

  return (
    <Svg width={width} height={height} viewBox="0 0 120 285" preserveAspectRatio="xMidYMid meet">
      {/* head + neck */}
      <Circle cx={C} cy={28} r={headR} fill={color} />
      <Rect x={C - 6} y={42} width={12} height={14} fill={color} />
      {/* arms */}
      <Rect x={sL - 13} y={56} width={13} height={86} rx={6.5} fill={color} />
      <Rect x={sR} y={56} width={13} height={86} rx={6.5} fill={color} />
      <Circle cx={sL - 6.5} cy={144} r={8} fill={color} />
      <Circle cx={sR + 6.5} cy={144} r={8} fill={color} />
      {/* torso */}
      <Path d={torso} fill={color} />
      {/* legs */}
      <Rect x={hL} y={146} width={legLW} height={122} rx={legLW / 2} fill={color} />
      <Rect x={C + legGap / 2} y={146} width={legRW} height={122} rx={legRW / 2} fill={color} />
      {/* feet */}
      <Ellipse cx={hL + legLW / 2} cy={274} rx={11} ry={7} fill={color} />
      <Ellipse cx={C + legGap / 2 + legRW / 2} cy={274} rx={11} ry={7} fill={color} />
    </Svg>
  );
}

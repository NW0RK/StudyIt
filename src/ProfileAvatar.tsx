import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { avatarRecipe } from './avatar';

/** Generated locally from an identity seed, including newly synced personas. */
export default function ProfileAvatar({ seed, size = 32 }: { seed: string; size?: number }) {
  const { background, shapes } = avatarRecipe(seed);
  const elements = { circle: Circle, ellipse: Ellipse, path: Path, rect: Rect };
  return <View accessible={false} style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: background }}><Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
    <Circle cx={50} cy={50} r={50} fill={background} />
    {shapes.map((shape, index) => { const Element = elements[shape.kind]; return <Element key={index} {...shape.props} />; })}
  </Svg></View>;
}

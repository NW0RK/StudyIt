/** One deterministic drawing recipe shared by the native UI and SVG exporter. */
export type AvatarShape = {
  kind: 'circle' | 'ellipse' | 'rect' | 'path';
  props: Record<string, string | number>;
};
export const avatarBackgrounds = ['#b8d8ff', '#d8c4ff', '#ffc5d6', '#ffd198', '#a9e4d2', '#ffe89e', '#b9e4ee', '#edbaff'];
export function avatarHash(seed: string): number {
  let hash = 2166136261;
  for (const character of seed.normalize('NFC')) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  return hash >>> 0;
}
export function avatarRecipe(seed: string): { background: string; shapes: AvatarShape[] } {
  let state = avatarHash(seed);
  const next = (max: number) => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) % max; };
  const background = avatarBackgrounds[next(avatarBackgrounds.length)];
  const ink = '#283344';
  const metal = ['#f8fafc', '#fff2d8', '#e6f8f5', '#e8edff'][next(4)];
  const shirt = ['#5365b9', '#20766b', '#bd5777', '#b56736', '#6e53a3', '#346b98'][next(6)];
  const accessory = next(5);
  const eyes = next(3);
  const headWidth = 48 + next(3) * 3;
  const left = (100 - headWidth) / 2;
  const shapes: AvatarShape[] = [];
  const add = (kind: AvatarShape['kind'], props: AvatarShape['props']) => shapes.push({ kind, props });
  add('ellipse', { cx: 50, cy: 102, rx: 36, ry: 31, fill: shirt });
  add('rect', { x: 44, y: 66, width: 12, height: 15, rx: 4, fill: metal, stroke: ink, strokeWidth: 2 });
  add('rect', { x: left - 6, y: 44, width: 9, height: 16, rx: 4, fill: shirt, stroke: ink, strokeWidth: 2 });
  add('rect', { x: 97 - left, y: 44, width: 9, height: 16, rx: 4, fill: shirt, stroke: ink, strokeWidth: 2 });
  add('rect', { x: left, y: 28, width: headWidth, height: 43, rx: accessory === 2 ? 18 : 12, fill: metal, stroke: ink, strokeWidth: 2.5 });
  if (accessory === 0 || accessory === 3) {
    add('path', { d: accessory === 0 ? 'M50 28V17H61' : 'M50 28V15H39', fill: 'none', stroke: ink, strokeWidth: 2.5, strokeLinecap: 'round' });
    add('circle', { cx: accessory === 0 ? 64 : 36, cy: accessory === 0 ? 17 : 15, r: 5, fill: shirt, stroke: ink, strokeWidth: 2 });
  } else if (accessory === 1) {
    add('path', { d: 'M28 32Q50 14 72 32L50 39Z', fill: shirt, stroke: ink, strokeWidth: 2, strokeLinejoin: 'round' });
    add('path', { d: 'M72 32V44', stroke: ink, strokeWidth: 2, fill: 'none' });
  } else if (accessory === 4) {
    add('rect', { x: 37, y: 19, width: 26, height: 11, rx: 4, fill: shirt, stroke: ink, strokeWidth: 2 });
  }
  if (eyes === 1) {
    add('path', { d: 'M35 49Q39 44 43 49M57 49Q61 44 65 49', stroke: ink, strokeWidth: 3, strokeLinecap: 'round', fill: 'none' });
  } else {
    for (const cx of [39, 61]) {
      add('ellipse', { cx, cy: 48, rx: eyes === 2 ? 3 : 3.5, ry: eyes === 2 ? 5 : 4, fill: ink });
      add('circle', { cx: cx + 1, cy: 46.5, r: 1, fill: '#fff' });
    }
  }
  if (accessory === 2 || accessory === 3) {
    add('rect', { x: 30, y: 41, width: 18, height: 14, rx: 5, fill: 'none', stroke: ink, strokeWidth: 2 });
    add('rect', { x: 52, y: 41, width: 18, height: 14, rx: 5, fill: 'none', stroke: ink, strokeWidth: 2 });
    add('path', { d: 'M48 47H52', stroke: ink, strokeWidth: 2, fill: 'none' });
  }
  add('path', { d: next(2) ? 'M44 60Q50 65 56 60' : 'M46 61H54', stroke: ink, strokeWidth: 2.2, strokeLinecap: 'round', fill: 'none' });
  add('circle', { cx: 32, cy: 57, r: 3, fill: '#ec9da7', opacity: .65 });
  add('circle', { cx: 68, cy: 57, r: 3, fill: '#ec9da7', opacity: .65 });
  add('path', { d: 'M44 85L50 88L56 85V95L50 98L44 95Z', fill: metal, stroke: ink, strokeWidth: 1.5, strokeLinejoin: 'round' });
  return { background, shapes };
}
export const personaAvatarSeed = (id: string, name: string) => `persona:${id}:${name}`;
export const learnerAvatarSeed = (name: string) => `learner:${name}`;
export function avatarSvg(seed: string): string {
  const { background, shapes } = avatarRecipe(seed);
  const attribute = (name: string) => name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="128" height="128"><defs><clipPath id="round"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#round)"><circle cx="50" cy="50" r="50" fill="${background}"/>${shapes.map(shape => `<${shape.kind} ${Object.entries(shape.props).map(([key, value]) => `${attribute(key)}="${value}"`).join(' ')}/>`).join('')}</g></svg>`;
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { avatarRecipe, avatarSvg, learnerAvatarSeed, personaAvatarSeed } from '../src/avatar';

test('profile pictures stay stable across export and runtime, with varied backgrounds', () => {
  const seeds = Array.from({ length: 30 }, (_, i) => personaAvatarSeed(`person-${i}`, `Teacher ${i}`));
  assert.ok(new Set(seeds.map(seed => avatarRecipe(seed).background)).size >= 6);
  assert.equal(new Set(seeds.map(avatarSvg)).size, seeds.length);
  for (const seed of seeds) {
    assert.deepEqual(avatarRecipe(seed), avatarRecipe(seed));
    assert.ok(avatarSvg(seed).includes(`fill="${avatarRecipe(seed).background}"`));
  }
  assert.notEqual(learnerAvatarSeed('Maya'), personaAvatarSeed('maya', 'Maya'));
});

test('untrusted persona names are only drawing seeds and never become SVG markup', () => {
  const output = avatarSvg(personaAvatarSeed('new', '"><script>alert(1)</script>'));
  assert.ok(output.startsWith('<svg'));
  assert.ok(!output.includes('script'));
  assert.ok(!output.includes('alert'));
});

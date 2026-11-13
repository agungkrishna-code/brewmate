/** Collision-resistant local ids without extra native dependencies. */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomChunk(length: number): string {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function createId(prefix = ''): string {
  const time = Date.now().toString(36);
  return `${prefix}${time}${randomChunk(8)}`;
}

export function createRecipeId(): string {
  return createId('recipe-');
}

export function createSessionId(): string {
  return createId('session-');
}

export function createBeanId(): string {
  return createId('bean-');
}

export function createGrinderId(): string {
  return createId('grinder-');
}

export function createGrindSettingId(): string {
  return createId('grind-');
}

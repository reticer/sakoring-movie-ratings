export const ADJECTIVES = [
  'Happy', 'Sleepy', 'Grumpy', 'Silly', 'Brave', 
  'Clever', 'Swift', 'Quiet', 'Loud', 'Calm'
];

export const ANIMALS = [
  'Panda', 'Tiger', 'Lion', 'Bear', 'Wolf', 
  'Fox', 'Rabbit', 'Deer', 'Owl', 'Hawk'
];

export const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];

export function randomizeIdentity(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const newIdentity = `${adj} ${animal} ${emoji}`;
  localStorage.setItem('chat_identity', newIdentity);
  return newIdentity;
}

export function getMyIdentity(): string {
  let identity = localStorage.getItem('chat_identity');
  if (!identity) {
    identity = randomizeIdentity();
  }
  return identity;
}

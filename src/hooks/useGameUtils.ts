export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerName(): string {
  const adjectives = ['Swift', 'Clever', 'Brave', 'Wise', 'Bold', 'Calm', 'Sharp', 'Quick'];
  const nouns = ['Fox', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Lion', 'Cat', 'Dog'];
  return (
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)]
  );
}

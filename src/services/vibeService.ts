/** Minimal shape needed to score a vibe match — lets us score the logged-in
 *  Profile against any public_profiles/attendee row without a full Profile. */
export type VibeInput = {
  top_genres?: string[] | null;
  top_artists?: string[] | null;
  vibe_tags?: string[] | null;
};

export const ALL_GENRES = [
  'Hip-Hop', 'Electronic', 'Indie', 'R&B', 'Pop', 'Rock',
  'Jazz', 'House', 'Techno', 'Afrobeats', 'Reggaeton', 'Classical',
  'Metal', 'Soul', 'Funk', 'Bollywood', 'Lo-Fi', 'Drum & Bass',
] as const;

export const ALL_VIBES = [
  '🔥 Hype', '🌿 Chill', '🎵 Live Music', '🍕 Foodie', '💃 Dance',
  '🎤 Karaoke', '🌙 Late Night', '🏡 Intimate', '🎨 Creative',
  '🤝 Networking', '🍸 Cocktails', '🎮 Games',
] as const;

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  let inter = 0;
  setA.forEach(x => { if (setB.has(x)) inter++; });
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function artistOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map(s => s.toLowerCase().trim()));
  const setB = new Set(b.map(s => s.toLowerCase().trim()));
  let shared = 0;
  setA.forEach(x => { if (setB.has(x)) shared++; });
  return Math.min(1, shared / Math.min(setA.size, setB.size));
}

/**
 * Returns a 0–100 vibe compatibility score between two profiles.
 * Weights: genres 40%, vibe_tags 35%, artists 25%
 */
export function computeVibeScore(a: VibeInput, b: VibeInput): number {
  const genreScore  = jaccard(a.top_genres  ?? [], b.top_genres  ?? []);
  const vibeScore   = jaccard(a.vibe_tags   ?? [], b.vibe_tags   ?? []);
  const artistScore = artistOverlap(a.top_artists ?? [], b.top_artists ?? []);

  const raw = genreScore * 0.40 + vibeScore * 0.35 + artistScore * 0.25;
  return Math.round(raw * 100);
}

/** Returns a colour and label for a given 0–100 score */
export function scoreLabel(score: number): { color: string; text: string } {
  if (score >= 80) return { color: '#00D37F', text: `${score}% vibe match 🔥` };
  if (score >= 55) return { color: '#F59E0B', text: `${score}% vibe match` };
  if (score >= 30) return { color: 'rgba(232,227,216,0.6)', text: `${score}% vibe match` };
  return { color: 'rgba(232,227,216,0.3)', text: 'Different vibes' };
}

/** Ring border colour for avatar overlays */
export function scoreRingColor(score: number): string {
  if (score >= 70) return '#00D37F';
  if (score >= 40) return '#F59E0B';
  return 'rgba(255,255,255,0.15)';
}

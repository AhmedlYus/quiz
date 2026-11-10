// GET leaderboard (see server/leaderboard/routes.js).
export type LeaderboardPlayer = {
  rank: number;
  nickname: string;
  points: number;
  mastered: number;
  answered: number;
  bestStreak: number;
  me: boolean;
};

export type Leaderboard = {
  /** Number of questions in the bank, the denominator for "mastered". */
  total: number;
  players: LeaderboardPlayer[];
  /** The signed-in player when outside the returned list. */
  me: LeaderboardPlayer | null;
};

export const LEADERBOARD_PATH = 'leaderboard?limit=500';

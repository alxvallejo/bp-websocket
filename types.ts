export type UserData = {
  email: string;
  name: string;
  id: string;
};

export type PlayerData = {
  created_at: string;
  email: string;
  id: string;
  name: string;
  score: number;
};

export type Player = {
  answered: boolean;
  email: string;
  name: string;
  playerData: PlayerData;
  socketId: string;
};

export type PlayerAnswer = {
  email: string;
  answer: string;
};

export type Option = {
  isAnswer: boolean;
  option: string;
};

export type GamePublic = {
  category: string;
  gameId: number;
  options: Option[];
  question: string;
};

export type Game = {
  category: string;
  gameId: number;
  options: Option[];
  question: string;
  correctAnswer: Option;
  answerContext: string;
  keywords: string;
};

export type AnswerImg = {
  image: string;
  keywords: string;
};

export type Standup = {
  categorySelector: Player;
  isBowpourri: boolean;
  isComplete: boolean;
  nextSpinner: Player;
  nextWinnerEmail: string;
  players: Player[];
};

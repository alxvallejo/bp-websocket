import { Tables } from './database.types';

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
  playerData: PlayerData | {};
  socketId: string;
  isCorrect?: boolean;
} | null;

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

/**
 * Socket.io
 */

// export type Socket = {
//   on(
//     arg0: any
//   ): unknown;
//   removeAllListeners(): unknown;
//   id: string;
//   emit: (arg0: string, arg1: any) => void;
// };
export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
  hello: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

/**
 * Express basics
 */
export interface ExpressResponse {
  send: (arg0: string) => void;
}

/**
 * TriviaQuestions
 */
export type CreateTriviaQuestionInput = {
  created_by: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
};

// export type TriviaQuestion = CreateTriviaQuestionInput & {
//   id: string;
//   created_at: string;
//   answered_on: string | null;
//   percent_correct: number | null;
// };

export type TriviaQuestion = Tables<'trivia_questions'>;

// export type UpdateTriviaQuestion = {}

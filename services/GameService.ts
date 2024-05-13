import { PlayerAnswer, Game, AnswerImg, Player, Option } from '../types';

class GameService {
  playerPresence: (players: Player[]) => void;
  propogateScores: (players: Player[]) => Promise<void>;
  players: { [email: string]: Player | null };
  playerAnswers: PlayerAnswer[] | null;
  category: string | null;
  newGame: Game | null;
  correctAnswer: Option | undefined | null;
  answerImg: AnswerImg | null;
  answerContext: string | null;
  keywords: string | null;

  constructor(
    presenceCb: (players: Player[]) => void,
    propogateScores: (players: Player[]) => Promise<void>
  ) {
    this.playerPresence = presenceCb;
    this.propogateScores = propogateScores;
    this.players = {};
    this.playerAnswers = null;
    this.category = null;
    this.newGame = null;
    this.correctAnswer = undefined;
    this.answerImg = null;
    this.answerContext = null;
    this.keywords = null;
  }

  reset = () => {
    this.playerAnswers = null;
    this.category = null;
    this.newGame = null;
    this.correctAnswer = null;
    this.answerImg = null;
    this.answerContext = null;
    this.keywords = null;
  };

  getPlayers = (): Player[] => {
    const players = Object.values(this.players).filter((x) => x !== null);
    console.log('players: ', players);
    return players;
  };

  setPlayer = (email: string, player: Player) => {
    const players = this.players || {};
    players[email] = player;
    this.players = players;
    return this.getPlayers();
  };

  removePlayer = (email: string) => {
    const players = this.players || {};
    players[email] = null;
    this.players = players;
  };

  getPlayer = (email: string) => {
    return this.players[email];
  };

  setCategory = (category: string) => {
    this.category = category;
  };

  getCategory = () => {
    return this.category;
  };

  setGame = (newGame: Game) => {
    if (!newGame || !newGame.options) {
      return;
    }
    const correctAnswer = newGame.options.find((x) => x.isAnswer);
    this.newGame = newGame;
    this.correctAnswer = correctAnswer;
    this.answerContext = newGame.answerContext;
    this.keywords = newGame.keywords;
  };

  getGame = () => {
    return this.newGame;
  };

  setAnswer = (answer: Option) => {
    this.correctAnswer = answer;
  };

  getAnswer = () => {
    return this.correctAnswer;
  };

  getAnswerContext = () => {
    return this.answerContext;
  };

  setAnswerImg = (image: string, keywords: string) => {
    this.answerImg = {
      image,
      keywords,
    };
  };

  getAnswerImg = () => {
    return this.answerImg;
  };

  setPlayerAnswer = (email: string, answer: string) => {
    let playerAnswers = this.playerAnswers || [];
    playerAnswers = [...playerAnswers, { email, answer }];
    this.playerAnswers = playerAnswers;
  };

  submitAnswer = (email: string, answer: string) => {
    if (!this.newGame) {
      return;
    }
    // const options = this.newGame.options;
    // const matchingOption = options.find((x) => x.option == answer);
    const updatePlayer = this.getPlayer(email);
    if (!updatePlayer) {
      return;
    }
    updatePlayer['answered'] = true;
    this.players[email] = updatePlayer;
    this.setPlayerAnswer(email, answer);

    const players = this.getPlayers();
    this.propogateScores(players);
  };

  getPlayerScores = (): Player[] => {
    if (!this.correctAnswer) {
      return this.getPlayers();
    }
    // Loop through player answers and update the players object with `isCorrect`
    this.playerAnswers?.map((player, i) => {
      const isCorrect = this.correctAnswer?.option == player.answer;
      const email = player.email;
      const p = this.players?.[email];
      if (p) {
        const newP = { ...p, isCorrect };
        this.players[email] = newP;
      }
    });
    return this.getPlayers();
  };
}

module.exports = {
  GameService,
};

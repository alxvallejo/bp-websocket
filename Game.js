class Game {
  constructor(presenceCb, propogateScores) {
    this.playerPresence = presenceCb;
    this.propogateScores = propogateScores;
    this.players = {};
    this.playerAnswers = null;
    this.category = null;
    this.newGame = null;
    this.correctAnswer = null;
    this.answerImg = null;
    this.answerContext = null;
    this.keywords = null;
  }

  reset = () => {
    this.players = {};
    this.playerAnswers = null;
    this.category = null;
    this.newGame = null;
    this.correctAnswer = null;
    this.answerImg = null;
    this.answerContext = null;
    this.keywords = null;
  };

  getPlayers = () => {
    return Object.values(this.players);
  };

  setPlayer = (email, playerData) => {
    let players = this.players || {};
    players[email] = playerData;
    this.players = players;
    return this.getPlayers();
  };

  removePlayer = (email) => {
    let players = this.players || {};
    players[email] = null;
    this.players = players;
  };

  getPlayer = (email) => {
    return this.players[email];
  };

  setCategory = (category) => {
    this.category = category;
  };

  getCategory = () => {
    return this.category;
  };

  setGame = (newGame) => {
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

  setAnswer = (answer) => {
    this.correctAnswer = answer;
  };

  getAnswer = () => {
    return this.correctAnswer;
  };

  getAnswerContext = () => {
    return this.answerContext;
  };

  setAnswerImg = (image, keywords) => {
    this.answerImg = {
      image,
      keywords,
    };
  };

  getAnswerImg = () => {
    return this.answerImg;
  };

  setPlayerAnswer = (email, answer) => {
    let playerAnswers = this.playerAnswers || [];
    playerAnswers = [...playerAnswers, { email, answer }];
    this.playerAnswers = playerAnswers;
  };

  submitAnswer = (email, answer) => {
    if (!this.newGame) {
      return;
    }
    const options = this.newGame.options;
    const matchingOption = options.find((x) => x.option == answer);
    let updatePlayer = this.getPlayer(email);
    if (!updatePlayer) {
      return;
    }
    updatePlayer['answered'] = true;
    this.players[email] = updatePlayer;
    this.setPlayerAnswer(email, answer);

    const players = this.getPlayers();
    this.propogateScores(players);
  };

  getPlayerScores = () => {
    if (!this.correctAnswer) {
      return this.players;
    }
    // Loop through player answers and update the players object with `isCorrect`
    this.playerAnswers.map((player, i) => {
      const isCorrect = this.correctAnswer.option == player.answer;
      const email = player.email;
      this.players[email]['isCorrect'] = isCorrect;
    });
    return this.getPlayers();
  };
}

module.exports = {
  Game,
};

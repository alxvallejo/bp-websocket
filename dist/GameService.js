"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GameService {
    constructor(presenceCb, propogateScores) {
        this.reset = () => {
            this.playerAnswers = null;
            this.category = null;
            this.newGame = null;
            this.correctAnswer = null;
            this.answerImg = null;
            this.answerContext = null;
            this.keywords = null;
        };
        this.getPlayers = () => {
            const players = Object.values(this.players);
            console.log('players: ', players);
            return players;
        };
        this.setPlayer = (email, player) => {
            let players = this.players || {};
            players[email] = player;
            this.players = players;
            return this.getPlayers();
        };
        this.removePlayer = (email) => {
            let players = this.players || {};
            players[email] = null;
            this.players = players;
        };
        this.getPlayer = (email) => {
            return this.players[email];
        };
        this.setCategory = (category) => {
            this.category = category;
        };
        this.getCategory = () => {
            return this.category;
        };
        this.setGame = (newGame) => {
            if (!newGame || !newGame.options) {
                return;
            }
            const correctAnswer = newGame.options.find((x) => x.isAnswer);
            this.newGame = newGame;
            this.correctAnswer = correctAnswer;
            this.answerContext = newGame.answerContext;
            this.keywords = newGame.keywords;
        };
        this.getGame = () => {
            return this.newGame;
        };
        this.setAnswer = (answer) => {
            this.correctAnswer = answer;
        };
        this.getAnswer = () => {
            return this.correctAnswer;
        };
        this.getAnswerContext = () => {
            return this.answerContext;
        };
        this.setAnswerImg = (image, keywords) => {
            this.answerImg = {
                image,
                keywords,
            };
        };
        this.getAnswerImg = () => {
            return this.answerImg;
        };
        this.setPlayerAnswer = (email, answer) => {
            let playerAnswers = this.playerAnswers || [];
            playerAnswers = [...playerAnswers, { email, answer }];
            this.playerAnswers = playerAnswers;
        };
        this.submitAnswer = (email, answer) => {
            if (!this.newGame) {
                return;
            }
            const options = this.newGame.options;
            // const matchingOption = options.find((x) => x.option == answer);
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
        this.getPlayerScores = () => {
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
}
module.exports = {
    GameService,
};

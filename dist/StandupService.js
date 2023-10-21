"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StandupService {
    constructor(refreshWheel, spinWheel) {
        this.reset = () => {
            this.players = {};
            this.selectedSpinner = null;
        };
        this.getPlayers = () => {
            if (!this.players) {
                return [];
            }
            return Object.values(this.players);
        };
        this.getPlayerEmails = () => {
            if (!this.players) {
                return [];
            }
            return Object.keys(this.players);
        };
        this.setPlayer = (email, playerData) => {
            let players = this.players || [];
            players[email] = playerData;
            this.players = players;
        };
        this.removePlayer = (email) => {
            let players = this.players || {};
            delete players[email];
            this.players = players;
            return this.getPlayers();
        };
        this.joinStandup = (email, playerData) => {
            let players;
            if (!this.selectedSpinner) {
                console.log('starting new standup - no selected spinner', email);
                this.setPlayer(email, playerData);
                players = this.getPlayers();
                console.log('refresh wheel with players: ', players);
                this.selectedSpinner = playerData;
                this.refreshWheel(players, playerData);
            }
            else {
                console.log('joining existing standup', email);
                this.setPlayer(email, playerData);
                players = this.getPlayers();
                this.refreshWheel(players, this.selectedSpinner);
            }
        };
        this.handleSpin = () => {
            var _a, _b, _c;
            let newPlayers, newPlayerEmails, currentSpinner = '';
            if (!this.selectedSpinner) {
                console.log('no selected spinner, return same array');
                // New game
                newPlayers = this.getPlayers();
                newPlayerEmails = this.getPlayerEmails();
            }
            else {
                currentSpinner = ((_a = this.selectedSpinner) === null || _a === void 0 ? void 0 : _a.email) || '';
                console.log(`Removing ${(_b = this.selectedSpinner) === null || _b === void 0 ? void 0 : _b.email}`);
                // Remove this player
                newPlayers = this.removePlayer((_c = this.selectedSpinner) === null || _c === void 0 ? void 0 : _c.email);
                newPlayerEmails = this.getPlayerEmails();
            }
            console.log('newPlayerEmails: ', newPlayerEmails);
            // Randomize the remaining
            const randomIndex = Math.floor(Math.random() * newPlayerEmails.length);
            const randomWinner = newPlayerEmails[randomIndex];
            if (randomWinner) {
                this.selectedSpinner = this.players[randomWinner];
            }
            console.log('randomWinner: ', randomWinner);
            // Return winner + new list
            this.spinWheel(randomWinner, newPlayers, currentSpinner);
        };
        this.players = {};
        this.selectedSpinner = null;
        this.refreshWheel = refreshWheel;
        this.spinWheel = spinWheel;
    }
}
module.exports = {
    StandupService,
};

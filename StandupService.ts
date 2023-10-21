import { Player } from './types';

class StandupService {
  players: { [email: string]: Player };
  selectedSpinner: Player | null;
  refreshWheel: (players: Player[], playerData: Player) => void;
  spinWheel: (
    nextWinnerEmail: string,
    nextPlayers: Player[],
    currentSpinner: string
  ) => void;

  constructor(refreshWheel, spinWheel) {
    this.players = {};
    this.selectedSpinner = null;
    this.refreshWheel = refreshWheel;
    this.spinWheel = spinWheel;
  }

  reset = () => {
    this.players = {};
    this.selectedSpinner = null;
  };

  getPlayers = (): Player[] => {
    if (!this.players) {
      return [];
    }
    return Object.values(this.players);
  };

  getPlayerEmails = () => {
    if (!this.players) {
      return [];
    }
    return Object.keys(this.players);
  };

  setPlayer = (email: string, playerData: Player) => {
    let players = this.players || [];
    players[email] = playerData;
    this.players = players;
  };

  removePlayer = (email: string) => {
    let players = this.players || {};
    delete players[email];
    this.players = players;
    return this.getPlayers();
  };

  joinStandup = (email: string, playerData: Player) => {
    let players;
    if (!this.selectedSpinner) {
      console.log('starting new standup - no selected spinner', email);
      this.setPlayer(email, playerData);
      players = this.getPlayers();
      console.log('refresh wheel with players: ', players);
      this.selectedSpinner = playerData;
      this.refreshWheel(players, playerData);
    } else {
      console.log('joining existing standup', email);
      this.setPlayer(email, playerData);
      players = this.getPlayers();
      this.refreshWheel(players, this.selectedSpinner);
    }
  };

  handleSpin = () => {
    let newPlayers: Player[],
      newPlayerEmails: string[],
      currentSpinner: string = '';
    if (!this.selectedSpinner) {
      console.log('no selected spinner, return same array');
      // New game
      newPlayers = this.getPlayers();
      newPlayerEmails = this.getPlayerEmails();
    } else {
      currentSpinner = this.selectedSpinner?.email || '';
      console.log(`Removing ${this.selectedSpinner?.email}`);
      // Remove this player
      newPlayers = this.removePlayer(this.selectedSpinner?.email);
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
}

module.exports = {
  StandupService,
};

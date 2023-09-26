class Standup {
  constructor(refreshWheel, spinWheel) {
    this.players = null;
    this.selectedSpinner = null;
    this.refreshWheel = refreshWheel;
    this.spinWheel = spinWheel;
  }

  reset = () => {
    this.players = null;
    this.selectedSpinner = null;
  };

  getPlayers = () => {
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

  setPlayer = (email, playerData) => {
    // let players = this.players || {
    //   bowpourri: {
    //     email: null,
    //     name: 'bowpourri',
    //   },
    // };
    let players = this.players || [];
    players[email] = playerData;
    this.players = players;
    // return Object.values(players);
  };

  removePlayer = (email) => {
    let players = this.players || {};
    delete players[email];
    this.players = players;
    return this.getPlayers();
  };

  joinStandup = (email, playerData) => {
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
    let newPlayers, newPlayerEmails;
    if (!this.selectedSpinner) {
      console.log('no selected spinner, return same array');
      // New game
      newPlayers = this.getPlayers();
      newPlayerEmails = this.getPlayerEmails();
    } else {
      console.log(`Removing ${this.selectedSpinner?.email}`);
      // Remove this player
      newPlayers = this.removePlayer(this.selectedSpinner?.email);
      newPlayerEmails = this.getPlayerEmails();
    }
    console.log('newPlayerEmails: ', newPlayerEmails);
    // Randomize the remaining
    const randomIndex = Math.floor(Math.random() * newPlayerEmails.length);
    const randomWinner = newPlayerEmails[randomIndex];

    this.selectedSpinner = this.players[randomWinner];

    console.log('randomWinner: ', randomWinner);
    // Return winner + new list
    this.spinWheel(randomWinner, newPlayers);
  };
}

module.exports = {
  Standup,
};

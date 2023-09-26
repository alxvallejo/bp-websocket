require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { Server } = require('socket.io');
const { Game } = require('./Game');
const { Standup } = require('./Standup');

const app = express();
const server = http.createServer(app);

// const ws = new WebSocketServer({ server });
// const wss = new WebSocket.Server({ server });
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://indie-8bb1.fly.dev',
      'https://bowpourri-remix.netlify.app',
      'http://192.168.1.170:3000',
      'http://192.168.1.170:3001',
    ],
  },
});

const supabaseUrl = 'https://gcztkgzefsiujhojbycl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openAi = require('./services/openai');
const serp = require('./services/serp');

const port = 8080; // express
const wsPort = 4000; // WebSocket

const roomName = 'trivia';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const ANSWER_BUFFER = 5; // After last player answers, provide a buffer to change answer
let timeoutId;

// Standup callback fns

// Emit the next set of players including the selectedSpinner
const refreshWheel = (players, selectedSpinner) => {
  console.log('refreshing wheel');
  io.emit('refreshWheel', players, selectedSpinner);
};

const spinWheel = (nextWinnerEmail, nextPlayers) => {
  console.log('spinning wheel');
  io.emit('spinResults', nextWinnerEmail, nextPlayers);
};

// Game callback fns
// These are used as callbacks from the Game object's state.

const presenceCb = (players) => {
  console.log('broadcasting player list', players);
  io.emit('players', players);
};

const propogateScores = async (players) => {
  console.log('propogating scores');
  // If all players have answered, start a timeout and then emit the answer
  const unanswered = players.filter((x) => !x.answered);
  if (unanswered.length == 0) {
    console.log(
      'All players have answered, setTimeout for reporting final scores'
    );
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(async () => {
      const correctAnswer = game.getAnswer();
      io.emit('answer', correctAnswer);

      const answerContext = game.getAnswerContext();
      io.emit('answerContext', answerContext);

      const answerImg = game.getAnswerImg();
      console.log('answerImg on complete: ', answerImg);
      io.emit('answerImg', answerImg);

      // Return playerScores
      const players = game.getPlayerScores();
      io.emit('players', players);

      // Save scores
      let updatedPlayers = [];
      let correctPlayers = [];
      for (let player of players) {
        const playerData = player.playerData;
        const email = player.email;
        const name = player.name;
        const isCorrect = player.isCorrect;
        let newScore;
        if (playerData?.score) {
          newScore = isCorrect ? playerData.score + 1 : playerData.score;
        } else {
          newScore = isCorrect ? 1 : 0;
        }
        if (isCorrect) {
          correctPlayers.push(name);
        }
        const newPlayerData = { ...playerData, score: newScore };
        if (playerData) {
          console.log('updating playerData: ', playerData);
          const { data, error } = await supabase
            .from('profiles')
            .update({ score: newScore })
            .eq('id', playerData['id'])
            .select();
        } else {
          const { data, error } = await supabase
            .from('profiles')
            .insert({ score: newScore })
            .select();
        }
        const updatedPlayer = {
          ...player,
          playerData: newPlayerData,
        };
        updatedPlayers.push(updatedPlayer);
      }

      console.log('updatedPlayers: ', updatedPlayers);

      // Emit the updated players with new scores
      // Additionally retrieve user scores
      const { data: playerStats, error: userDataError } = await supabase
        .from('profiles')
        .select();
      io.emit('playerStats', playerStats, true);

      // Update game record
      const { data: gameUpdate, error: gameError } = await supabase
        .from('games')
        .update({
          players: updatedPlayers,
          winners: correctPlayers,
          completed_on: new Date().toISOString(),
        });

      // Finally, reset game state
      game.reset();
    }, ANSWER_BUFFER * 1000);
  }
};

const dispatchUserCategories = async () => {
  const { data: userCategories, error: getCatsError } = await supabase
    .from('categories')
    .select();
  io.emit('userCategories', userCategories);
};

const dispatchMyCategories = async (socket) => {
  const { data: userCategories, error: getCatsError } = await supabase
    .from('categories')
    .select();
  socket.emit('userCategories', userCategories);
};

const dispatchGameRules = async (socket) => {
  // Get game rules
  const { data: rules, error: rulesError } = await supabase
    .from('rules')
    .select()
    .limit(1);
  socket.emit('gameRules', rules[0]);
};

// Instantiate the Game
const game = new Game(presenceCb, propogateScores);

// Instantiate the Standup
const standUp = new Standup(refreshWheel, spinWheel);
console.log('New StandUp instantiated.');

// A new client connection request received
io.on('connection', function (socket) {
  console.log(`Recieved a new connection.`);
  socket.emit('message', `You are socket ${socket.id}`);

  // Grab players and emit them
  // presenceCb(game.getPlayers());
  // const players = game.getPlayers();
  // console.log('players: ', players);

  // Check if newGame is set
  const existingGame = game.getGame();
  console.log('existingGame: ', existingGame);
  if (existingGame) {
    const parsed = openAi.parseForPlayer(existingGame);
    console.log('Emitting parsed game: ', parsed);
    socket.emit('newGame', parsed);
  }

  dispatchMyCategories(socket);
  dispatchGameRules(socket);

  const handleNewGame = async (name, newCategory) => {
    console.log('newCategory: ', newCategory);

    const existingCategory = game.getCategory();
    if (existingCategory) {
      console.log('existingCategory', existingCategory);
      // return;
    }
    // Let everyone know what the category is
    io.emit('category', name, newCategory);

    game.setCategory(newCategory);
    const newGame = await openAi.newGame(newCategory);
    console.log('newGame: ', newGame);

    // Save new game
    const { data, error } = await supabase
      .from('games')
      .insert({ game: newGame })
      .select();

    if (error) {
      console.log('error: ', error);
      io.emit('newGameError', error);
      return;
    }

    console.log('data: ', data);
    const gameId = data[0].id;

    const savedGame = { ...newGame, gameId, category: newCategory };
    console.log('savedGame: ', savedGame);

    game.setGame(savedGame);

    // Additionally save category
    const { data: gameUpdate, error: gameError } = await supabase
      .from('games')
      .update({ category: newCategory });

    const parsed = openAi.parseForPlayer(savedGame);
    console.log('Emitting parsed game: ', parsed);
    io.emit('newGame', parsed);

    // const { keywords } = newGame;
    // const imgSearch = await serp.searchGoogleImages(keywords);
    // if (imgSearch) {
    //   const randomImg = imgSearch[Math.floor(Math.random() * imgSearch.length)];
    //   game.setAnswerImg(randomImg, keywords);
    // }
  };

  // On category select, start the game and dispatch the question
  socket.on('category', async (name, newCategory) => {
    handleNewGame(name, newCategory);
    // Additionally handle a spin on the standup so that the next spinner can be queued
    console.log('handling spin');
    standUp.handleSpin();
  });

  socket.on('refreshGame', async (name, newCategory) => {
    console.log(`${name} refreshed the game`);
    handleNewGame(name, newCategory);
  });

  socket.on('answer', (email, answer) => {
    console.log('email: ', email);
    console.log('answer: ', answer);

    game.submitAnswer(email, answer);
    const players = game.getPlayers();
    io.emit('players', players);
  });

  socket.on('signIn', async (userData) => {
    console.log('userData on SignIn: ', userData);
    socket.emit('message', `${userData.email} Joining room ${roomName}`);
    const email = userData.email;
    const name = userData.name || email;
    let playerData = {
      socketId: socket.id,
      name,
      email,
      answered: false,
    };

    // Grab scores from supabase
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('email', email);
    if (data) {
      playerData['playerData'] = data[0];
    }

    const players = game.setPlayer(email, playerData);
    io.emit('players', players);

    // Add to standUp (wip)
    standUp.joinStandup(email, playerData);

    // Additionally check for latest game status
    const existingGame = game.getGame();
    console.log('existingGame: ', existingGame);
    const category = game.getCategory();
    if (category) {
      console.log('category: ', category);
      socket.emit('category', category);
    }
    if (existingGame) {
      const parsed = openAi.parseForPlayer(existingGame);
      console.log('Emitting parsed game: ', parsed);
      socket.emit('newGame', parsed);
    }
    dispatchUserCategories();
  });

  socket.on('playerStats', async () => {
    // Additionally retrieve user scores
    const { data: playerStats, error: userDataError } = await supabase
      .from('profiles')
      .select();
    socket.emit('playerStats', playerStats);
  });

  socket.on('clearPlayerStats', async () => {
    console.log('clearing stats');
    const { error } = await supabase.from('profiles').update({ score: 0 });
    const { data: playerStats, error: userDataError } = await supabase
      .from('profiles')
      .select();
    socket.emit('playerStats', playerStats);
  });

  socket.on('signOut', (email) => {
    console.log('email: ', email);
    console.log('socket id on signout', socket.id);
  });

  socket.on('resetGame', (email) => {
    game.reset();
    io.emit('resetGame', `${email} reset the game!`);
  });

  socket.on('editMinPlayers', async (newMinPlayers) => {
    const { data: rules, error: rulesError } = await supabase
      .from('rules')
      .update({ min_players: newMinPlayers })
      .eq('id', 1)
      .select();
    io.emit('gameRules', rules[0]);
  });

  socket.on('addCategory', async (category, created_by) => {
    const { data: newCategory, error: newCatError } = await supabase
      .from('categories')
      .insert({ name: category, created_by })
      .select();
    dispatchUserCategories();
  });

  socket.on('deleteCategory', async (categoryId) => {
    const { data: newCategory, error: newCatError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    dispatchUserCategories();
  });

  socket.on('handleSpin', () => {
    console.log('handling spin');
    standUp.handleSpin();
  });

  socket.on('kickOff', (name) => {
    const players = game.getPlayers();
    const newPlayers = players.filter((x) => x.name !== name);
  });

  socket.on('disconnect', (reason) => {
    // players = players.filter((x) => x.socketId !== socket.id);
    // players[socket.id] = null;
    console.log('disconnecting', socket.id);
    // io.emit('signOut', socket.id);
    socket.removeAllListeners();
  });
});

app.listen(port, () => console.log(`express listening on port ${port}`));

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // delete cookies on sign out
    const expires = new Date(0).toUTCString();
    document.cookie = `my-access-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
    document.cookie = `my-refresh-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years, never expires
    document.cookie = `my-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
    document.cookie = `my-refresh-token=${session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
  }
});

app.get('/categories', async (req, res) => {
  const { data: categories, error: userDataError } = await supabase
    .from('categories')
    .select();
  res.send(JSON.stringify(categories));
});

app.post('/addCategory', async (req, res) => {
  console.log('req.body: ', req.body);
  const { category, created_by } = req.body;
  const { data: newCategory, error: userDataError } = await supabase
    .from('categories')
    .insert({ category, created_by })
    .select();

  res.send('Adding category');
});

app.get('/notes', async (req, res) => {
  // const user = supabase.auth.user();
  // console.log('user: ', user);
  let { data, error, status } = await supabase
    .from('notes')
    .select()
    .eq('id', user.id);
});

app.post('/addNote', async (req, res) => {
  console.log('req.body: ', req.body);
  const user = supabase.auth.user();
  const { category, created_by } = req.body;
  // const { data: newCategory, error: userDataError } = await supabase
  //   .from('categories')
  //   .insert({ category, created_by })
  //   .select();

  res.send('Adding note');
});

app.get('/picks', async (req, res) => {
  // const user = supabase.auth.user();
  // console.log('user: ', user);
  let { data, error, status } = await supabase
    .from('notes')
    .select()
    .eq('id', user.id);
});

app.get('/', (req, res) => {
  res.send('Hello world');
});

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

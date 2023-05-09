require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { Server } = require('socket.io');
const { Game } = require('./Game');

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
      'http://192.168.1.170:3000',
      'http://192.168.1.170:3001',
    ],
  },
});

const supabaseUrl = 'https://gcztkgzefsiujhojbycl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openAi = require('./services/openai');

const port = 8080; // express
const wsPort = 4000; // WebSocket

const roomName = 'trivia';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const MIN_PLAYERS = 1;
const ANSWER_BUFFER = 5; // After last player answers, provide a buffer to change answer
let timeoutId;

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

      // Return playerScores
      const players = game.getPlayerScores();
      io.emit('players', players);

      // Save scores
      let updatedPlayers = [];
      for (let player of players) {
        const playerData = player.playerData;
        console.log('player: ', player);
        console.log('playerData: ', playerData);
        const email = player.email;
        const name = player.name;
        console.log('name: ', name);
        const isCorrect = player.isCorrect;
        let newScore;
        if (playerData?.score) {
          newScore = isCorrect ? playerData.score + 1 : playerData.score;
        } else {
          newScore = isCorrect ? 1 : 0;
        }
        const newPlayerData = { ...playerData, score: newScore };
        if (playerData) {
          console.log('updating playerData: ', playerData);
          const { data, error } = await supabase
            .from('users')
            .update({ email, name, score: newScore })
            .eq('id', playerData['id'])
            .select();
        } else {
          const { data, error } = await supabase
            .from('users')
            .insert({ email, name, score: newScore })
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
        .from('users')
        .select();
      io.emit('playerStats', playerStats, true);

      // Finally, reset game state
      game.reset();
    }, ANSWER_BUFFER * 1000);
  }
};

const dispatchUserCategories = async () => {
  const { data: userCategories, error: getCatsError } = await supabase
    .from('categories')
    .select();
  console.log('userCategories: ', userCategories);
  io.emit('userCategories', userCategories);
};

// Instantiate the class
const game = new Game(presenceCb, propogateScores);

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

  // dispatchUserCategories();

  // On category select, start the game and dispatch the question
  socket.on('category', async (name, newCategory) => {
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

    const savedGame = { ...newGame, gameId };

    game.setGame(savedGame);

    const parsed = openAi.parseForPlayer(savedGame);
    console.log('Emitting parsed game: ', parsed);
    io.emit('newGame', parsed);
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
      .from('users')
      .select()
      .eq('email', email);
    if (data) {
      playerData['playerData'] = data[0];
    }

    const players = game.setPlayer(email, playerData);
    io.emit('players', players);

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
      .from('users')
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

  socket.on('disconnect', (reason) => {
    // players = players.filter((x) => x.socketId !== socket.id);
    // players[socket.id] = null;
    console.log('disconnecting', socket.id);
    // io.emit('signOut', socket.id);
    socket.removeAllListeners();
  });
});

// app.listen(port, () => console.log(`express listening on port ${port}`));

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

app.get('/', (req, res) => {
  res.send('Hello world');
});

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

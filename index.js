require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// const ws = new WebSocketServer({ server });
// const wss = new WebSocket.Server({ server });
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://indie-8bb1.fly.dev'],
  },
});

const supabaseUrl = 'https://gcztkgzefsiujhojbycl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const openAi = require('./services/openai');

const port = 8080; // express
const wsPort = 4000; // WebSocket

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const MIN_PLAYERS = 1;
const ANSWER_BUFFER = 5; // After last player answers, provide a buffer to change answer
let timeoutId;
let fetchingNewGame = false;
let category;
let newGame = {};
let correctAnswer;

// app.get('/newGame', async (req, res) => {
//   try {
//     let resp = await openAi.newGame();
//     resp = openAi.parseForPlayer(resp);
//     res.send(resp);
//   } catch (e) {
//     res.send(e);
//   }
// });

let players = [];

// A new client connection request received
io.on('connection', function (socket) {
  console.log(`Recieved a new connection.`);
  socket.emit('message', 'We see you');

  const handleNewGame = async () => {
    if (!category) {
      console.log('No category sele');
      return;
    }
    if (Object.keys(newGame).length !== 0) {
      console.log('newGame already exists: ', newGame);
      const parsed = openAi.parseForPlayer(newGame);
      io.emit('newGame', parsed);
      // return newGame;
    } else {
      console.log('fetching new game...');
      let resp = await openAi.newGame(category);
      newGame = resp;
      console.log('newGame: ', newGame);
      correctAnswer = newGame.options.find((x) => x.isAnswer);

      const parsed = openAi.parseForPlayer(resp);
      io.emit('newGame', parsed);
      // console.log('type', typeof resp);
      // return;
    }
  };

  const resetGame = () => {
    (timeoutId = null),
      (fetchingNewGame = false),
      (category = null),
      (newGame = {}),
      (correctAnswer = null);
  };

  socket.on('category', (newCategory) => {
    console.log('newCategory: ', newCategory);
    if (category) {
      console.log('already a category: ', category);

      return;
    }
    category = newCategory;
    // Let everyone know what the category is
    io.emit('category', newCategory);

    // Ask Chat GPT for question
    handleNewGame();
  });

  socket.on('answer', (answer) => {
    console.log('answer: ', answer);
    console.log('newGame: ', newGame);
    // Determine option
    const matchingOption = newGame.options.find((x) => x.option == answer);

    console.log('matchingOption: ', matchingOption);
    console.log('players: ', players);
    const matchingPlayerIndex = players.findIndex(
      (x) => x.email == socket.email
    );

    if (matchingOption && (matchingPlayerIndex || matchingPlayerIndex === 0)) {
      console.log('matching answer found, updating player', players);
      socket.answer = matchingOption;
      const isCorrect = correctAnswer.option == matchingOption;
      const email = players[matchingPlayerIndex]['email'];
      players[matchingPlayerIndex]['answered'] = true;
      io.emit('players', players);

      // If all players have answered, start a timeout and then emit the answer
      const unanswered = players.filter((x) => !x.answered);
      if (unanswered.length == 0) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(async () => {
          io.emit('answer', correctAnswer);
          players[matchingPlayerIndex]['isCorrect'] = isCorrect;
          io.emit('players', players);

          // Save score
          const playerData = players[matchingPlayerIndex]['playerData'];
          if (playerData) {
            const existingScore = playerData['score'];
            const { data, error } = await supabase
              .from('users')
              .update({ email, score: existingScore + 1 })
              .eq('id', playerData['id']);
          } else {
            const { data, error } = await supabase
              .from('users')
              .insert({ email, score: 1 });
          }

          // Reset state
          resetGame();
          players = [];
        }, ANSWER_BUFFER * 1000);
      }
    }
  });

  socket.on('signIn', async (userData) => {
    console.log('players: ', players);
    const email = userData.email;
    const name = userData.name || email;
    socket.email = email;
    // Check if already signed in
    const match = players.find((x) => (x.email = email));
    if (match) {
      return;
    }
    let playerData = {
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
      playerData['playerData'] = data;
    }

    players.push(playerData);
    console.log('players: ', players);

    io.emit('players', players);

    if (category) {
      io.emit('category', category);
    }
  });

  socket.on('disconnect', (reason) => {
    players = players.filter((x) => x.email !== socket.email);
    console.log('socket.email: ', socket.email);
    io.emit('players', players);
  });
});

// app.listen(port, () => console.log(`express listening on port ${port}`));

app.get('/', (req, res) => {
  res.send('Hello world');
});

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

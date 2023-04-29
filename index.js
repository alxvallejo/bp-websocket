require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
// const WebSocket = require('ws');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// const ws = new WebSocketServer({ server });
// const wss = new WebSocket.Server({ server });
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

const openAi = require('./services/openai');

const port = 8080; // express
const wsPort = 4000; // WebSocket

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/newGame', async (req, res) => {
  try {
    let resp = await openAi.newGame();
    resp = openAi.parseForPlayer(resp);
    res.send(resp);
  } catch (e) {
    res.send(e);
  }
});

let players = [];

// A new client connection request received
io.on('connection', function (socket) {
  console.log(`Recieved a new connection.`);
  socket.emit('message', 'We see you');

  socket.on('signIn', (userData) => {
    const email = userData.email;
    const name = userData.name || email;
    socket.email = email;
    // Check if already signed in
    const match = players.find((x) => (x.email = email));
    if (match) {
      return;
    }
    console.log('players: ', players);
    players.push({
      name,
      email,
    });
    console.log('players: ', players);
    socket.emit('players', players);
  });

  socket.on('disconnect', (reason) => {
    players = players.filter((x) => x.email !== socket.email);
    console.log('socket.email: ', socket.email);
    socket.emit('players', players);
  });
});

// app.listen(port, () => console.log(`express listening on port ${port}`));

app.get('/', (req, res) => {
  res.send('Hello world');
});

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

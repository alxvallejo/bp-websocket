require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// const ws = new WebSocketServer({ server });
const wss = new WebSocket.Server({ server });
const cors = require('cors');
const bodyParser = require('body-parser');
const openAi = require('./services/openai');

const port = 8080; // express
const wsPort = 8000; // WebSocket

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

// app.post('/signIn', async (req, res) => {
//   console.log('req: ', req);
// });

// I'm maintaining all active connections in this object
let clients = {};
let players = [];

// A new client connection request received
wss.on('connection', function (ws) {
  // Generate a unique code for every user
  console.log(`Recieved a new connection.`);

  ws.send(JSON.stringify({ message: 'We see you' }));

  ws.on('message', (data, isBinary) => {
    // RULE: Send only JSON friendly data so it can be parsed without a try/catch here :)
    const message = isBinary ? data : JSON.parse(data.toString());

    console.log('message', message);
    console.log('message type', typeof message);

    // const test = JSON.parse(message);
    // console.log('test: ', test);

    const handleSend = (data) => {
      const payload = JSON.stringify(data);
      console.log('payload: ', payload);
      ws.send(payload);
    };

    if (!message.type) {
      return;
    }
    if (message.type == 'signIn' && message.user) {
      const email = message.user.email;
      const name = message.user?.name || email;
      ws.email = email;
      // clients.push(ws);
      clients[email] = ws;
      console.log('players: ', players);
      players.push({
        name,
        email,
      });
      console.log('players: ', players);
      ws.send(JSON.stringify({ type: 'players', data: players }));
    }
  });

  ws.on('close', (code, reason) => {
    delete players[ws.email];
    console.log('ws.email: ', ws.email);
  });
});

app.listen(port, () => console.log(`express listening on port ${port}`));

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

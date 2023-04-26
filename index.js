require('dotenv').config();
const { WebSocketServer } = require('ws');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });
const cors = require('cors');
const bodyParser = require('body-parser');
const openAi = require('./services/openai');

const port = 8000;

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

// I'm maintaining all active connections in this object
const clients = {};

// A new client connection request received
wsServer.on('connection', function (connection) {
  // Generate a unique code for every user
  const userId = uuidv4();
  console.log(`Recieved a new connection.`);

  // Store the new connection and handle messages
  clients[userId] = connection;
  console.log(`${userId} connected.`);
});

app.listen(8080, () => console.log('express listening on port 8080'));

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// const wsServer = new WebSocketServer({ server });
const wsServer = new WebSocket.Server({ server });
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

// I'm maintaining all active connections in this object
const clients = {};

// A new client connection request received
wsServer.on('connection', function (ws) {
  // Generate a unique code for every user
  console.log(`Recieved a new connection.`);
});

app.listen(port, () => console.log(`express listening on port ${port}`));

server.listen(wsPort, () => {
  console.log(`WebSocket server is running on port ${wsPort}`);
});

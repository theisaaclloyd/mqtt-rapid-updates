// server/index.js
const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

// set up basic express server
const app = express();
app.use(cors());
app.use(express.json());

// connect to MQTT broker
const client = mqtt.connect("mqtt://mqtt:1883");

let connected = false;

client.on('connect', () => {
  console.log('Express connected to MQTT broker');
  connected = true;
});

client.on('error', (error) => {
  console.error('MQTT error: ', error);
  connected = false;
});

// http routes
app.get('/test', (req, res) => {
  res.json({ express: true, mqtt: connected, message: `Server connected! MQTT: ${connected ? "" : "not"} connected!` });
});

// on post request, forward message to MQTT broker
app.post('/update', (req, res) => {
  const { message, sent } = req.body;
  console.log('Received message: ', message);

  client.publish('updates', JSON.stringify({ message, sent, atServer: new Date() }));
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

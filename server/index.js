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

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// http routes
app.get('/test', (req, res) => {
  res.end('Server is working!');
});

// on post request, forward message to MQTT broker
app.post('/update', (req, res) => {
  const { message } = req.body;
  console.log('Received message: ', message);

  // attach timestamp to message to show what time it was received by the express server
  client.publish('updates', JSON.stringify({ message, timestamp: new Date() }));
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

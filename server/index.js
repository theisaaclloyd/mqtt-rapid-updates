// server/index.js
const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = mqtt.connect(process.env.MQTT_URL || 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

app.post('/update', (req, res) => {
  const { message } = req.body;
  console.log('Received message:', message);
  client.publish('updates', JSON.stringify({ message, timestamp: new Date() }));
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

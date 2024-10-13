"use client";
import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const App = () => {
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<{ message: string; timestamp: number }[]>([]);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('updates');
    });

    client.on('message', (topic, message) => {
      const update = JSON.parse(message.toString());
      setReceivedMessages(prev => [...prev, update]);
    });

    return () => {
      client.end();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await fetch('http://localhost:4000/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `"${message}" - sent: ${formatTime(new Date())}` })
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (now: Date) => {
    return now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Real-time Updates</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Enter a message"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
      <div>
        <h2 className="text-xl font-semibold mb-2">Received Messages:</h2>
        <ul>
          {receivedMessages.map((msg, index) => (
            <li key={index} className="mb-1">
              {msg.message}; received: {formatTime(new Date(msg.timestamp))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

"use client";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import mqtt from "mqtt";

interface message {
  message: string;
  timestamp: number;
}

const App = () => {
  const [outgoingMessage, setOutgoingMessage] = useState<string>("");
  const [incomingMessages, setIncomingMessages] = useState<message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // api host is where we send messages via HTTP
  const API_HOST = "http://localhost:4000";

  // mqtt host is where we listen for new messages via MQTT
  const MQTT_HOST = "wss://localhost:9001";

  useEffect(() => {
    const client = mqtt.connect(`${MQTT_HOST}`, {
      protocol: "wss",
      keepalive: 30,
      protocolVersion: 4,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      clean: true,
    });

    client.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to MQTT broker, subscribing to 'updates' topic");
      client.subscribe("updates");
    });

    client.on("error", (err) => {
      setIsConnected(false);
      console.error("MQTT connection error:", err);
    });

    client.on("message", (topic, message) => {
      const update = JSON.parse(message.toString());
      console.log(`New message received on '${topic}': ${update}`);
      setIncomingMessages((prev) => [...prev, update]);
    });

    return () => {
      client.end();
    };
  }, [MQTT_HOST]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await fetch(`${API_HOST}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `"${outgoingMessage}" - sent: ${formatTime(new Date())}`,
        }),
      });

      setOutgoingMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (now: Date) => {
    return now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Real-time Updates</h1>
      <p className="mb-2">
        MQTT Host: {MQTT_HOST}, API Host: {API_HOST}, MQTT Status:{" "}
        {isConnected ? "Connected" : "Not connected"}
      </p>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={outgoingMessage}
          onChange={(e) => setOutgoingMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Enter a message"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
      <div>
        <h2 className="text-xl font-semibold mb-2">Received Messages:</h2>
        <ul>
          {incomingMessages.map((msg, index) => (
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

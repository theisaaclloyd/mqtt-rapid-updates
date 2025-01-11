"use client";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import mqtt from "mqtt";
import { Send, Wifi, WifiOff } from "lucide-react";

interface Message {
  message: string;
  sent: Date;
  atServer: Date;
  received: Date;
}

const App = () => {
  const [outgoingMessage, setOutgoingMessage] = useState<string>("");
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const API_HOST = "http://localhost:4000";
  const MQTT_HOST = "ws://localhost:9001";

  useEffect(() => {
    const client = mqtt.connect(`${MQTT_HOST}`, {
      protocol: "ws",
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
      setIncomingMessages((prev) => [
        ...prev,
        { ...update, received: new Date() },
      ]);
    });

    return () => {
      client.end();
    };
  }, [MQTT_HOST]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!outgoingMessage.trim()) return;

    try {
      await fetch(`${API_HOST}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${outgoingMessage}`,
          sent: new Date(),
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real-time Updates</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-red-500" size={20} />
          )}
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
        <div className="flex gap-2">
          <span className="text-gray-500">MQTT Host:</span>
          <span className="font-mono">{MQTT_HOST}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500">API Host:</span>
          <span className="font-mono">{API_HOST}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={outgoingMessage}
          onChange={(e) => setOutgoingMessage(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message here..."
        />
        <button
          type="submit"
          disabled={!outgoingMessage.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
          Send
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Messages</h2>
        {incomingMessages.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8">
            No messages yet. Send one to get started!
          </div>
        ) : (
          <ul className="space-y-3">
            {incomingMessages.map((msg, index) => (
              <li
                key={index}
                className="bg-white p-4 rounded-lg border shadow-sm"
              >
                <div className="font-medium mb-1">{msg.message}</div>
                <div className="text-sm text-gray-500">
                  sent by client: {formatTime(new Date(msg.sent))}; received by
                  server: {formatTime(new Date(msg.atServer))}; received by
                  client: {formatTime(new Date(msg.received))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;

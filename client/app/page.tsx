"use client";
import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import mqtt from "mqtt";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Send, Wifi, WifiOff, Server, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Message = {
  message: string;
  timestamp: number;
  sender?: string;
  sentAt: number; // Make sentAt required
  latency?: number; // Make latency optional since it's calculated on receipt
};

const App = () => {
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);

  const HOST = process.env.NEXT_PUBLIC_HOST || "localhost";

  useEffect(() => {
    const client = mqtt.connect(`ws://${HOST}:9001`);

    client.on("connect", () => {
      setConnected(true);
      setError(null);
      client.subscribe("updates");
    });

    client.on("error", (err) => {
      setError(`Failed to connect to MQTT broker: ${err.message}`);
      setConnected(false);
    });

    client.on("message", (topic, message) => {
      try {
        const update = JSON.parse(message.toString()) as Omit<
          Message,
          "latency"
        >;
        const receivedAt = Date.now();
        const latency = receivedAt - update.timestamp; // Calculate latency

        setReceivedMessages((prev) =>
          [
            {
              ...update,
              latency,
            },
            ...prev,
          ].slice(0, 50)
        );
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim()) return;

    const sentAt = Date.now();
    try {
      await fetch(`http://${HOST}:4000/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          sender: "You",
          timestamp: sentAt,
          sentAt: sentAt, // Ensure sentAt is included
        }),
      });
      setMessage("");
    } catch (error) {
      const err = error as Error;
      setError(`Failed to send message: ${err.message}`);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatLatency = (latency: number) => {
    if (latency < 1) return "<1ms";
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(2)}s`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-foreground">
                Real-time Messaging
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="w-4 h-4" />
                <span>{HOST}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Connected
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <WifiOff className="w-3 h-3" /> Disconnected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!connected || !message.trim()}
              className={cn(
                "flex items-center gap-2 transition-colors",
                connected && message.trim()
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </form>

          <div className="space-y-4">
            {receivedMessages.map((msg, index) => {
              const isFirst = index === 0;
              const showDate =
                isFirst ||
                formatDate(msg.timestamp) !==
                  formatDate(receivedMessages[index - 1]?.timestamp);

              return (
                <React.Fragment key={msg.timestamp}>
                  {showDate && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(msg.timestamp)}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-start gap-2 group">
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {msg.sender || "Anonymous"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(msg.timestamp)}
                          </div>
                          {msg.latency !== undefined && (
                            <Badge variant="secondary" className="text-[10px]">
                              {formatLatency(msg.latency)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-foreground">{msg.message}</p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {receivedMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;

export type WebSocketEvent = {
  type: string;
  [key: string]: unknown;
};

type EventHandler = (event: WebSocketEvent) => void;

const WS_URL = "ws://localhost:3002";

class GameWebSocket {
  private socket: WebSocket | null = null;
  private listeners = new Set<EventHandler>();

  connect(token: string) {
    if (!token) {
      throw new Error("WebSocket token is required");
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.socket = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(token)}`
    );

    this.socket.onopen = () => {
      console.log("WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const data: WebSocketEvent =
          JSON.parse(event.data);

        console.log("WebSocket received:", data);

        this.listeners.forEach((listener) => {
          listener(data);
        });
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    this.socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    };

    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this.socket = null;
    };
  }

  send(
    message: Record<string, unknown>
  ) {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );

      return;
    }

    this.socket.send(
      JSON.stringify(message)
    );
  }

  onMessage(handler: EventHandler) {
    this.listeners.add(handler);

    return () => {
      this.listeners.delete(handler);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  get isConnected() {
    return (
      this.socket?.readyState ===
      WebSocket.OPEN
    );
  }
}

export const gameSocket =
  new GameWebSocket();
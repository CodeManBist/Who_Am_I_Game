export type WebSocketEvent = {
  type: string;
  [key: string]: unknown;
};

type EventHandler = (event: WebSocketEvent) => void;
type StatusHandler = (connected: boolean) => void;

const WS_URL = "ws://localhost:3002";

class GameWebSocket {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private intentionallyDisconnected = false;

  private listeners = new Set<EventHandler>();

  private statusListeners =
    new Set<StatusHandler>();

  connect(token: string) {
    if (!token) {
      throw new Error(
        "WebSocket token is required"
      );
    }

    this.token = token;
    this.intentionallyDisconnected = false;

    if (
      this.socket &&
      (this.socket.readyState ===
        WebSocket.OPEN ||
        this.socket.readyState ===
          WebSocket.CONNECTING)
    ) {
      return;
    }

    this.socket = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(
        token
      )}`
    );

    const socket = this.socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.reconnectAttempts = 0;
      console.log(
        "WebSocket connected"
      );

      this.notifyStatus(true);
    };

    socket.onmessage = (event) => {
      if (this.socket !== socket) return;
      try {
        const data: WebSocketEvent =
          JSON.parse(event.data);

        console.log(
          "WebSocket received:",
          data
        );

        this.listeners.forEach(
          (listener) => {
            listener(data);
          }
        );
      } catch (error) {
        console.error(
          "Invalid WebSocket message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    };

    socket.onclose = () => {
      if (this.socket !== socket) return;
      console.log(
        "WebSocket disconnected"
      );

      this.socket = null;

      this.notifyStatus(false);
      if (!this.intentionallyDisconnected && this.token) {
        const delay = Math.min(10000, 500 * (2 ** this.reconnectAttempts++));
        this.reconnectTimer = window.setTimeout(() => {
          this.reconnectTimer = null;
          if (!this.intentionallyDisconnected && this.token) this.connect(this.token);
        }, delay);
      }
    };
  }

  send(
    message: Record<string, unknown>
  ) {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );

      return false;
    }

    console.log(
      "WebSocket sending:",
      message
    );

    this.socket.send(
      JSON.stringify(message)
    );

    return true;
  }

  onMessage(
    handler: EventHandler
  ) {
    this.listeners.add(handler);

    return () => {
      this.listeners.delete(
        handler
      );
    };
  }

  onStatus(
    handler: StatusHandler
  ) {
    this.statusListeners.add(
      handler
    );

    return () => {
      this.statusListeners.delete(
        handler
      );
    };
  }

  private notifyStatus(
    connected: boolean
  ) {
    this.statusListeners.forEach(
      (listener) => {
        listener(connected);
      }
    );
  }

  disconnect() {
    this.intentionallyDisconnected = true;
    this.token = null;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.notifyStatus(false);
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

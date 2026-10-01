import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { authenticateSocket } from "./auth";
import { prisma } from "@repo/db";

const rooms = new Map<string, Set<WebSocket>>();
const socketRooms = new Map<WebSocket, string>();
const countdowns = new Set<string>();
const server = createServer(async (req, res) => {
  const respond = (status: number, body: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST" || !["/internal/character-ready", "/internal/character-confirmed", "/internal/game-finished", "/internal/turn-changed", "/internal/start-game"].includes(req.url || "")) {
    respond(404, { success: false, message: "Not found" });
    return;
  }
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw) as { roomCode?: unknown; userId?: unknown };
    const roomCode = typeof body.roomCode === "string" ? body.roomCode : "";
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!roomCode || !userId) {
      respond(400, { success: false, message: "roomCode and userId are required" });
      return;
    }
    const game = await prisma.game.findUnique({ where: { roomCode }, include: { players: true } });
    if (!game || !game.players.some((player) => player.userId === userId)) {
      respond(404, { success: false, message: "Game or player not found" });
      return;
    }
    if (req.url === "/internal/start-game") {
      if (game.players.find((p) => p.userId === userId)?.position !== 1 || game.players.length !== 2 ||
        !game.players.every((p) => p.characterName && p.characterImageUrl && p.characterConfirmed)) {
        respond(403, { success: false, message: "Creator and both confirmed characters are required" });
        return;
      }
      void startCountdown(roomCode);
      respond(202, { success: true, status: game.status });
      return;
    }
    if (req.url === "/internal/game-finished") {
      const winnerUserId = typeof (body as { winnerUserId?: unknown }).winnerUserId === "string" ? (body as { winnerUserId: string }).winnerUserId : null;
      // The winner and result are public; the character itself remains private
      // to its owner and the player who correctly guessed it.
      broadcast(roomCode, { type: "game_finished", winnerUserId });
      respond(200, { success: true });
      return;
    }
    if (req.url === "/internal/turn-changed") {
      const currentTurn = typeof (body as { currentTurn?: unknown }).currentTurn === "number"
        ? (body as { currentTurn: number }).currentTurn
        : null;
      const action = (body as { action?: unknown }).action;
      if (currentTurn !== 1 && currentTurn !== 2) {
        respond(400, { success: false, message: "currentTurn must be 1 or 2" });
        return;
      }
      broadcast(roomCode, {
        type: "turn_changed",
        currentTurn,
        action: action === "answer" ? "answer" : "question",
      });
      respond(200, { success: true });
      return;
    }
    const eventType = req.url === "/internal/character-ready" ? "character_ready" : "character_confirmed";
    broadcast(roomCode, { type: eventType, userId });
    if (eventType === "character_confirmed") void startCountdown(roomCode);
    respond(200, { success: true });
  } catch (error) {
    console.error("Internal WebSocket notification failed:", error);
    respond(400, { success: false, message: "Invalid request" });
  }
});

function broadcast(roomCode: string, event: Record<string, unknown>) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const payload = JSON.stringify(event);
  for (const client of room) if (client.readyState === WebSocket.OPEN) client.send(payload);
}

async function startCountdown(roomCode: string) {
  if (countdowns.has(roomCode)) return;
  countdowns.add(roomCode);
  try {
    const game = await prisma.game.findUnique({ where: { roomCode }, include: { players: true } });
    if (!game || game.players.length !== 2 ||
      !game.players.every((p) => p.characterName && p.characterImageUrl && p.characterConfirmed)) return;

    let deadline = game.turnDeadline;
    if (["WAITING", "UPLOADING"].includes(game.status)) {
      deadline = new Date(Date.now() + 3000);
      const claimed = await prisma.game.updateMany({
        where: { id: game.id, status: game.status },
        data: { status: "COUNTDOWN", turnDeadline: deadline },
      });
      if (claimed.count !== 1) return;
    } else if (game.status === "COUNTDOWN" && !deadline) {
      // Recover older in-progress rows without a persisted deadline.
      deadline = new Date(Date.now() + 3000);
      const claimed = await prisma.game.updateMany({
        where: { id: game.id, status: "COUNTDOWN", turnDeadline: null },
        data: { turnDeadline: deadline },
      });
      if (claimed.count !== 1) return;
    } else if (game.status !== "COUNTDOWN" || !deadline) return;

    const countdownEndsAt = deadline.getTime();
    while (Date.now() < countdownEndsAt) {
      const seconds = Math.min(3, Math.ceil((countdownEndsAt - Date.now()) / 1000));
      broadcast(roomCode, { type: "game_countdown", seconds, countdownEndsAt });
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000, Math.max(1, countdownEndsAt - Date.now()))));
    }

    const startedAt = new Date();
    const started = await prisma.game.updateMany({
      where: { id: game.id, status: "COUNTDOWN" },
      data: { status: "PLAYING", currentTurn: 1, startedAt, turnDeadline: null },
    });
    if (started.count === 1) broadcast(roomCode, { type: "game_started", currentTurn: 1, action: "question" });
  } catch (error) {
    console.error(`Could not start countdown for ${roomCode}:`, error);
  } finally {
    countdowns.delete(roomCode);
  }
}

const wss = new WebSocketServer({ server });
wss.on("connection", (socket: WebSocket, request) => {
  let userId: string;
  try {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    userId = authenticateSocket(url.searchParams.get("token") || "");
    socket.send(JSON.stringify({ type: "authenticated", userId }));
  } catch {
    socket.close(1008, "Unauthorized");
    return;
  }

  const sendError = (message: string) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "error", message }));
  };

  socket.on("message", (data) => {
    void (async () => {
      try {
        const message = JSON.parse(data.toString()) as { type?: unknown; roomCode?: unknown; message?: unknown };
        if (!message || typeof message.type !== "string") return sendError("Invalid message");
        const roomCode = typeof message.roomCode === "string" ? message.roomCode : "";

        if (message.type === "join_game") {
          if (!roomCode) return sendError("Room code is required");
          const game = await prisma.game.findUnique({ where: { roomCode }, include: { players: true } });
          if (!game || !game.players.some((p) => p.userId === userId)) return sendError("You are not a player in this game");
          const previousCode = socketRooms.get(socket);
          if (previousCode && previousCode !== roomCode) {
            const previousRoom = rooms.get(previousCode);
            previousRoom?.delete(socket);
            if (previousRoom?.size === 0) rooms.delete(previousCode);
          }
          let room = rooms.get(roomCode);
          if (!room) rooms.set(roomCode, (room = new Set()));
          const isNewMember = !room.has(socket);
          room.add(socket);
          socketRooms.set(socket, roomCode);
          if (isNewMember) broadcast(roomCode, { type: "player_joined", userId });
          socket.send(JSON.stringify({ type: "room_state", status: game.status, currentTurn: game.currentTurn, action: game.currentTurn === 2 ? "answer" : "question", countdownEndsAt: game.turnDeadline?.getTime() ?? null }));
          if (["WAITING", "UPLOADING", "COUNTDOWN"].includes(game.status) && game.players.length === 2 &&
            game.players.every((p) => p.characterName && p.characterImageUrl && p.characterConfirmed)) {
            void startCountdown(roomCode);
          }
          return;
        }

        if (message.type === "question" || message.type === "answer") {
          const text = typeof message.message === "string" ? message.message.trim() : "";
          if (!roomCode || !text || text.length > 500) return sendError("Message must contain 1 to 500 characters");
          if (socketRooms.get(socket) !== roomCode) return sendError("Join this room before sending a message");
          const game = await prisma.game.findUnique({ where: { roomCode }, include: { players: true } });
          if (!game || game.status !== "PLAYING") return sendError("Game is not currently being played");
          const player = game.players.find((p) => p.userId === userId);
          if (!player) return sendError("You are not a player in this game");
          if (game.currentTurn !== player.position) return sendError("It is not your turn");
          const expectedType = player.position === 1 ? "question" : "answer";
          if (message.type !== expectedType) return sendError(`It is time to ${expectedType}`);
          const nextTurn = player.position === 1 ? 2 : 1;
          const saved = await prisma.$transaction(async (tx) => {
            const changed = await tx.game.updateMany({
              where: { id: game.id, status: "PLAYING", currentTurn: player.position },
              data: { currentTurn: nextTurn },
            });
            if (changed.count !== 1) return null;
            return tx.gameMessage.create({ data: { gameId: game.id, senderId: userId, type: message.type === "question" ? "QUESTION" : "ANSWER", message: text } });
          });
          if (!saved) return sendError("Turn already used; refresh the game state");
          broadcast(roomCode, { type: message.type === "question" ? "question_received" : "answer_received", messageId: saved.id, userId, message: saved.message, createdAt: saved.createdAt });
          broadcast(roomCode, { type: "turn_changed", currentTurn: nextTurn, action: message.type === "question" ? "answer" : "question" });
          return;
        }

        if (message.type === "start_game") return sendError("Game starts automatically when both characters are confirmed");
        sendError("Unknown message type");
      } catch (error) {
        console.error("WebSocket message failed:", error);
        sendError("Invalid message or server error");
      }
    })();
  });

  socket.on("close", () => {
    const roomCode = socketRooms.get(socket);
    socketRooms.delete(socket);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    room?.delete(socket);
    if (room?.size) broadcast(roomCode, { type: "player_left", userId });
    else rooms.delete(roomCode);
  });
});

server.listen(process.env.PORT || 3002, () => console.log(`WebSocket server running on port ${process.env.PORT || 3002}`));

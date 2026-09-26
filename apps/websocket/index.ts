import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { authenticateSocket } from "./auth";
import { prisma } from "@repo/db";

const server = createServer(async (req, res) => {
  if (
    req.method === "POST" &&
    req.url === "/internal/character-ready"
  ) {
    try {
      const body = await new Promise<string>((resolve, reject) => {
        let data = "";

        req.on("data", (chunk) => {
          data += chunk;
        });

        req.on("end", () => {
          resolve(data);
        });

        req.on("error", reject);
      });

      const { roomCode, userId } = JSON.parse(body);

      console.log("Character ready:", {
        roomCode,
        userId,
      });

      const room = rooms.get(roomCode);

      if (!room) {
        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: true,
            message: "No connected players in room",
          })
        );

        return;
      }

      // Tell the other player
      for (const client of room) {
        if (
          client.readyState === WebSocket.OPEN
        ) {
          client.send(
            JSON.stringify({
              type: "character_ready",
              userId,
            })
          );
        }
      }

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: true,
        })
      );
    } catch (error) {
      console.error("Character-ready event failed:", error);

      res.writeHead(400, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: false,
          message: "Invalid request",
        })
      );
    }

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ 
  server,
 });

const rooms = new Map<string, Set<WebSocket>>();
const socketRooms = new Map<WebSocket, string>();

wss.on("connection", (socket: WebSocket, request) => {
  try {
    // Authenticate connection
    const url = new URL(
      request.url || "",
      `http://${request.headers.host}`
    );

    const token = url.searchParams.get("token");
    const userId = authenticateSocket(token || "");

    console.log(`Authenticated user: ${userId}`);

    socket.send(
      JSON.stringify({
        type: "authenticated",
        userId,
      })
    );

    // Handle messages from this client
    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());

      //JOIN GAME
      if (message.type === "join_game") {
        const roomCode = message.roomCode;

        let room = rooms.get(roomCode);

        if (!room) {
          room = new Set<WebSocket>();
          rooms.set(roomCode, room);
        }

        room.add(socket);
        socketRooms.set(socket, roomCode);

        console.log(`${userId} joined room ${roomCode}`);

        for (const client of room) {
          if (
            client !== socket &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(
              JSON.stringify({
                type: "player_joined",
                userId,
              })
            );
          }
        }
      }

      //SEND MESSAGE
      if(message.type === "send_message") {
        const roomCode = message.roomCode;
        const room = rooms.get(roomCode);

        if(!room) {
          return;
        }

        for(const client of room) {
          if(client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message_received",
                userId,
                message: message.message,
              })
            );
          }
        }
      }

      if (message.type === "start_game") {
        const roomCode = message.roomCode;
      
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
      
        if (!game) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Game not found",
            })
          );
      
          return;
        }
      
        const currentPlayer = game.players.find(
          (player) => player.userId === userId
        );
      
        if (!currentPlayer) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "You are not a player in this game",
            })
          );
      
          return;
        }
      
        if (currentPlayer.position !== 1) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Only the room creator can start the game",
            })
          );
      
          return;
        }
      
        if (game.players.length !== 2) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Two players are required to start the game",
            })
          );
      
          return;
        }
      
        const allCharactersReady = game.players.every(
          (player) =>
            player.characterName &&
            player.characterImageUrl
        );
      
        if (!allCharactersReady) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Both players must upload their characters first",
            })
          );
      
          return;
        }
      
        await prisma.game.update({
          where: {
            id: game.id,
          },
          data: {
            status: "COUNTDOWN",
          },
        });
      
        const room = rooms.get(roomCode);
      
        if (!room) {
          return;
        }
      
        for (let seconds = 3; seconds >= 1; seconds--) {
          for (const client of room) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "game_countdown",
                  seconds,
                })
              );
            }
          }
      
          await new Promise((resolve) =>
            setTimeout(resolve, 1000)
          );
        }
      
        await prisma.game.update({
          where: {
            id: game.id,
          },
          data: {
            status: "PLAYING",
            startedAt: new Date(),
          },
        });
      
        for (const client of room) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "game_started",
              })
            );
          }
        }
      }

    });

    // Handle disconnect
    socket.on("close", () => {
      const roomCode = socketRooms.get(socket);

      if (!roomCode) {
        return;
      }

      const room = rooms.get(roomCode);

      if (!room) {
        return;
      }

      // Remove socket from room
      room.delete(socket);

      // Remove reverse lookup
      socketRooms.delete(socket);

      console.log(`${userId} left room ${roomCode}`);

      // Tell remaining players
      for (const client of room) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "player_left",
              userId,
            })
          );
        }
      }

      // Delete empty room
      if (room.size === 0) {
        rooms.delete(roomCode);
      }
    });
  } catch (error) {
    console.log(error, "WebSocket authentication failed");

    socket.close(1008, "Unauthorized");
  }
});



server.listen(process.env.PORT, () => {
  console.log("WebSocket server running on port " + process.env.PORT);
});
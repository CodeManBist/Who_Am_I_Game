import { type Request, type Response,Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '@repo/db';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { identifyCharacter } from '../services/gemini.service';
import { randomInt } from 'crypto';
import { matchesCharacterName } from '../services/character-name.service';

const roomRouter = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  const uploadToCloudinary = (
    buffer: Buffer,
    originalName: string
  ): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'who-am-i/characters',
          resource_type: 'image',
          public_id: `${Date.now()}-${originalName
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9-_]/g, '-')}`,
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error || new Error('Cloudinary upload failed')
            );
          }
  
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
  
      uploadStream.end(buffer);
    });
  };

roomRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

    if(!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const roomAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const roomCode = Array.from({ length: 6 }, () => roomAlphabet[randomInt(roomAlphabet.length)]).join('');

    const game = await prisma.$transaction(async (tx) => {
        const newGame = await tx.game.create({
            data: {
                roomCode,
                status: "WAITING",
            },
        });
        await tx.gamePlayer.create({

            data: {
                gameId: newGame.id,
                userId,
                position: 1,
            },
        });
        return newGame;
    })

    return res.status(201).json({
        message: "Room created successfully",
        game: {
            id: game.id,
            roomCode: game.roomCode,
            status: game.status,
        },
    });
    } catch (error) {
    console.error("CREATE ROOM ERROR:", error);

    return res.status(500).json({
        error: "Error creating room",
        details: error instanceof Error ? error.message : String(error),
    });
  }
});

roomRouter.get('/:roomCode', authenticateToken, async(req: Request<{ roomCode: string }>, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
    
        if (!userId) {
          return res.status(401).json({
            error: "Unauthorized",
          });
        }
    
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: {
              select: {
                id: true,
                position: true,
                userId: true,

                characterName: true,
                characterImageUrl: true,
                characterConfirmed: true,
                
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
    
        if (!game) {
          return res.status(404).json({
            error: "Room not found",
          });
        }
    
        // Check whether the requesting user belongs to this room
        const isPlayer = game.players.some(
          (player) => player.userId === userId
        );
    
        if (!isPlayer) {
          return res.status(403).json({
            error: "You are not a player in this room",
          });
        }
    
        return res.status(200).json({
          game: {
            id: game.id,
            roomCode: game.roomCode,
            status: game.status,
            currentTurn: game.currentTurn,
            turnDeadline: game.turnDeadline,
            startedAt: game.startedAt,
            endedAt: game.endedAt,
            players: game.players.map((player) => ({
              id: player.id,
              position: player.position,
              userId: player.userId,
              username: player.user.username,
              avatarUrl: player.user.avatarUrl,
            
              // Character details are private to their owner. Never serialize
              // an opponent's secret character into the room response.
              characterName: player.userId === userId ? player.characterName : null,
              characterImageUrl: player.userId === userId ? player.characterImageUrl : null,
            
              characterReady: Boolean(
                player.characterName && player.characterImageUrl
              ),
            
              characterConfirmed: player.characterConfirmed,
            })),
          },
        });
      } catch (error) {
        console.error("Get room error:", error);
    
        return res.status(500).json({
          error: "Failed to get room",
        });
      }
});

roomRouter.post('/:roomCode/join',authenticateToken, async (req: Request<{ roomCode: string }>, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;

        if(!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        const game = await prisma.game.findUnique({
            where: { roomCode },
            include: {
                players: true,
            },
        });

        if(!game) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if(game.status !== "WAITING") {
            return res.status(400).json({ message: 'Cannot join a game that has already started' });
        }

        if(game.players.length >= 2) {
            return res.status(400).json({ message: 'This room is already full' });
        }

        const alreadyJoined = game.players.some(player => player.userId === userId);

        if(alreadyJoined) {
            return res.status(400).json({ message: 'You have already joined this room' });
        }

        const position = game.players.length === 0 ? 1 : 2;

        const player = await prisma.gamePlayer.create({
            data: {
                gameId: game.id,
                userId,
                position,
            },
        });

        return res.status(200).json({
            message: 'Joined room successfully',
            player: {   
                id: player.id,
                position: player.position,
            },
            game: {
                id: game.id,
                roomCode: game.roomCode,
                status: game.status,
            }
        });

    } catch (error) {
        console.error("Error joining room:", error);
        res.status(500).json({ error: 'Error joining room' });
    }
});

roomRouter.post(
    '/:roomCode/leave',
    authenticateToken,
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        const player = game.players.find(
          (player) => player.userId === userId
        );
  
        if (!player) {
          return res.status(403).json({
            message: 'You are not a player in this room',
          });
        }
  
        // Game already finished
        if (game.status === 'FINISHED') {
          return res.status(400).json({
            message: 'Game has already finished',
          });
        }
  
        // Active game: finish the game but keep the player record
        if (
          game.status === 'COUNTDOWN' ||
          game.status === 'PLAYING'
        ) {
          const finished = await prisma.game.updateMany({
            where: { id: game.id, status: game.status },
            data: { status: 'FINISHED', endedAt: new Date(), turnDeadline: null },
          });
          if (finished.count === 1) {
            try {
              await fetch('http://localhost:3002/internal/game-finished', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, userId, winnerUserId: null }),
              });
            } catch (notificationError) {
              console.error('WebSocket leave notification failed:', notificationError);
            }
          }
  
          return res.status(200).json({
            message: 'You left the game. The game has been finished.',
          });
        }
  
        // WAITING / UPLOADING
        // Remove player from the room
        await prisma.gamePlayer.delete({
          where: {
            id: player.id,
          },
        });
  
        return res.status(200).json({
          message: 'Left room successfully',
        });
  
      } catch (error) {
        console.error('Error leaving room:', error);
  
        return res.status(500).json({
          error: 'Error leaving room',
        });
      }
    }
  );

  roomRouter.post(
    '/:roomCode/character',
    authenticateToken,
    upload.single('image'),
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      let uploadedPublicId: string | null = null;
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        if (!req.file) {
          return res.status(400).json({
            message: 'Character image is required',
          });
        }

        if (!req.file.mimetype.startsWith('image/')) {
          return res.status(400).json({ message: 'Only image uploads are supported' });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        const player = game.players.find(
          (player) => player.userId === userId
        );
  
        if (!player) {
          return res.status(403).json({
            message: 'You are not a player in this room',
          });
        }
  
        if (
          game.status !== 'WAITING' &&
          game.status !== 'UPLOADING'
        ) {
          return res.status(400).json({
            message: 'Character cannot be uploaded at this stage',
          });
        }
  
        // Cloudinary upload comes here.
        // AI identification comes here.
  
        // Temporary values until  AI services
        // are connected.
        const aiResult = await identifyCharacter(
          req.file.buffer,
          req.file.mimetype
        );

        console.log('GEMINI RESULT:', aiResult);

        if (!aiResult.validForGame) {
          return res.status(400).json({
            error: 'Invalid character image',
            message:
              aiResult.reason ||
              'Please upload a recognizable person or fictional character.',
          });
        }

        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
        uploadedPublicId = cloudinaryResult.public_id;
        const characterImageUrl = cloudinaryResult.secure_url;
        
        // AI will be added next.
        const characterName = aiResult.characterName;
        const characterFacts = aiResult.characterFacts;
        const aiConfidence = aiResult.confidence;
  
        const updatedPlayer = await prisma.$transaction(async (tx) => {
          // Touch the game row as a stage guard. Countdown claims this same
          // row, so a late upload cannot replace a confirmed character.
          const stage = await tx.game.updateMany({
            where: { id: game.id, status: { in: ['WAITING', 'UPLOADING'] } },
            data: { status: 'UPLOADING' },
          });
          if (stage.count !== 1) return null;
          return tx.gamePlayer.update({
            where: { id: player.id },
            data: { characterName, characterImageUrl, characterFacts, aiConfidence, characterConfirmed: false },
          });
        });
        if (!updatedPlayer) {
          if (uploadedPublicId) await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'image' });
          uploadedPublicId = null;
          return res.status(409).json({ message: 'Character cannot be uploaded at this stage' });
        }
        uploadedPublicId = null;

        // Notify WebSocket server; persistence succeeds even if the live
        // notification service is temporarily unavailable.
        try {
          const notification = await fetch("http://localhost:3002/internal/character-ready", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              roomCode,
              userId,
            }),
          });
          if (!notification.ok) console.error('WebSocket character-ready notification failed:', notification.status);
        } catch (notificationError) {
          console.error('WebSocket character-ready notification failed:', notificationError);
        }
  
        const updatedPlayers =
          await prisma.gamePlayer.findMany({
            where: {
              gameId: game.id,
            },
          });
  
        const bothPlayersReady =
          updatedPlayers.length === 2 &&
          updatedPlayers.every(
            (player) =>
              player.characterName &&
              player.characterImageUrl
          );
  
        return res.status(200).json({
          message: 'Character uploaded successfully',
  
          player: {
            id: updatedPlayer.id,
            position: updatedPlayer.position,
            characterName: updatedPlayer.characterName,
            characterFacts: updatedPlayer.characterFacts,
            aiConfidence: updatedPlayer.aiConfidence,
            characterImageUrl:
              updatedPlayer.characterImageUrl,
          },
  
          game: {
            roomCode: game.roomCode,
            status: 'UPLOADING',
            bothPlayersReady,
          },
        });
  
      } catch (error) {
        if (uploadedPublicId) {
          try {
            await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'image' });
          } catch (cleanupError) {
            console.error('Could not clean up failed character upload:', cleanupError);
          }
        }
        console.error(
          'Character upload error:',
          error
        );
  
        return res.status(500).json({
          error: 'Failed to upload character',
        });
      }
    }
  );

  roomRouter.post(
    '/:roomCode/character/confirm',
    authenticateToken,
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        const player = game.players.find(
          (player) => player.userId === userId
        );
  
        if (!player) {
          return res.status(403).json({
            message: 'You are not a player in this room',
          });
        }
  
        if (
          game.status !== 'WAITING' &&
          game.status !== 'UPLOADING'
        ) {
          return res.status(400).json({
            message: 'Character cannot be confirmed at this stage',
          });
        }
  
        if (
          !player.characterName ||
          !player.characterImageUrl
        ) {
          return res.status(400).json({
            message: 'Please upload and identify your character before confirming',
          });
        }
  
        const updatedPlayer =
          await prisma.gamePlayer.update({
            where: {
              id: player.id,
            },
            data: {
              characterConfirmed: true,
            },
          });
  
        const updatedPlayers =
          await prisma.gamePlayer.findMany({
            where: {
              gameId: game.id,
            },
          });
  
        const bothPlayersConfirmed =
          updatedPlayers.length === 2 &&
          updatedPlayers.every(
            (player) => player.characterConfirmed
          );
  
        // Notify WebSocket server
        try {
          const notification = await fetch(
            'http://localhost:3002/internal/character-confirmed',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                roomCode,
                userId,
              }),
            }
          );
          if (!notification.ok) console.error('WebSocket character-confirmed notification failed:', notification.status);
        } catch (wsError) {
          console.error(
            'Failed to notify WebSocket server:',
            wsError
          );
        }
  
        return res.status(200).json({
          message: 'Character confirmed successfully',
  
          player: {
            id: updatedPlayer.id,
            position: updatedPlayer.position,
            characterConfirmed:
              updatedPlayer.characterConfirmed,
          },
  
          game: {
            roomCode: game.roomCode,
            status: game.status,
            bothPlayersConfirmed,
          },
        });
      } catch (error) {
        console.error(
          'Character confirmation error:',
          error
        );
  
        return res.status(500).json({
          error: 'Failed to confirm character',
        });
      }
    }
  );

roomRouter.post('/:roomCode/start', authenticateToken, async (req: Request<{ roomCode: string }>, res: Response) => {
    const userId = req.user?.userId;
    const { roomCode } = req.params;

    if(!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const game = await prisma.game.findUnique({
        where: { 
            roomCode 
        },
        include: {
            players: true,
        },
    });

    if(!game) {
        return res.status(404).json({ message: 'Room not found' });
    }

    const player = game.players.find(player => player.userId === userId);

    if(!player) {
        return res.status(403).json({ message: 'You are not a player in this room' });
    }

    if(player.position !== 1) return res.status(403).json({ message: 'Only the creator can start the game' });
    if (game.players.length !== 2 || !game.players.every((p) => p.characterName && p.characterImageUrl && p.characterConfirmed)) {
      return res.status(400).json({ message: 'Both players must confirm their characters first' });
    }
    if (game.status === 'PLAYING' || game.status === 'FINISHED') {
      return res.status(400).json({ message: 'Game cannot be started in its current state' });
    }
    try {
      const response = await fetch('http://localhost:3002/internal/start-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, userId }),
      });
      const data = await response.json() as { message?: string };
      if (!response.ok) return res.status(response.status).json({ message: data.message || 'Could not start game' });
      const latest = await prisma.game.findUnique({ where: { id: game.id }, select: { status: true } });
      return res.status(202).json({ message: 'Game countdown requested', game: { id: game.id, roomCode, status: latest?.status ?? game.status } });
    } catch (error) {
      console.error('Game start request failed:', error);
      return res.status(503).json({ message: 'Game service is unavailable' });
    }
});

roomRouter.post('/:roomCode/rematch', authenticateToken, async (req: Request<{ roomCode: string }>, res: Response) => {
  const userId = req.user?.userId;
  const { roomCode } = req.params;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const game = await prisma.game.findUnique({ where: { roomCode }, include: { players: true } });
    if (!game) return res.status(404).json({ message: 'Room not found' });
    if (!game.players.some((p) => p.userId === userId)) return res.status(403).json({ message: 'You are not a player in this room' });
    if (game.status !== 'FINISHED') return res.status(400).json({ message: 'The game is not finished' });
    const reset = await prisma.$transaction(async (tx) => {
      const changed = await tx.game.updateMany({
        where: { id: game.id, status: 'FINISHED' },
        data: { status: 'WAITING', currentTurn: null, turnDeadline: null, winnerPlayerId: null, startedAt: null, endedAt: null },
      });
      if (changed.count !== 1) return false;
      await tx.gameMessage.deleteMany({ where: { gameId: game.id } });
      await tx.gamePlayer.updateMany({
        where: { gameId: game.id },
        data: { characterName: null, characterImageUrl: null, characterFacts: {}, aiConfidence: null, characterConfirmed: false },
      });
      return true;
    });
    if (!reset) return res.status(409).json({ message: 'Another player already restarted this room' });
    return res.status(200).json({ message: 'Room is ready for a rematch', game: { roomCode, status: 'WAITING' } });
  } catch (error) {
    console.error('Rematch error:', error);
    return res.status(500).json({ error: 'Could not restart the room' });
  }
});

roomRouter.post(
    '/:roomCode/guess',
    authenticateToken,
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
        const { guess } = req.body;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        if (typeof guess !== 'string' || !guess.trim() || guess.trim().length > 100) {
          return res.status(400).json({
            message: 'Guess is required',
          });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        if (game.status !== 'PLAYING') {
          return res.status(400).json({
            message: 'Game is not currently being played',
          });
        }
  
        const player = game.players.find(
          (player) => player.userId === userId
        );
  
        if (!player) {
          return res.status(403).json({
            message: 'You are not a player in this game',
          });
        }

        if (game.currentTurn !== player.position) {
          return res.status(400).json({ message: 'You can only guess during your turn' });
        }
  
        const opponent = game.players.find(
          (player) => player.userId !== userId
        );
  
        if (!opponent) {
          return res.status(400).json({
            message: 'Opponent not found',
          });
        }
  
        if (!opponent.characterName) {
          return res.status(400).json({
            message: 'Opponent character is not ready',
          });
        }
  
        const facts = opponent.characterFacts;
        const aliases = facts && typeof facts === 'object' && !Array.isArray(facts) &&
          Array.isArray(facts.aliases)
          ? facts.aliases.filter((alias): alias is string => typeof alias === 'string')
          : [];
        const isCorrect = matchesCharacterName(guess, opponent.characterName, aliases);
  
        const accepted = await prisma.$transaction(async (tx) => {
          const changed = await tx.game.updateMany({
            where: { id: game.id, status: 'PLAYING', currentTurn: player.position },
            data: isCorrect
              ? { status: 'FINISHED', winnerPlayerId: player.id, endedAt: new Date(), turnDeadline: null }
              : { currentTurn: player.position === 1 ? 2 : 1 },
          });
          if (changed.count !== 1) return false;
          await tx.gameMessage.create({ data: { gameId: game.id, senderId: userId, type: 'GUESS', message: guess.trim() } });
          return true;
        });
        const finalGame = await prisma.game.findUnique({ where: { id: game.id } });
        if (!accepted) return res.status(409).json({ message: finalGame?.status === 'FINISHED' ? 'Game already finished' : 'The turn changed before your guess was accepted' });
        if (!isCorrect) {
          try {
            const notification = await fetch('http://localhost:3002/internal/turn-changed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomCode,
                userId,
                currentTurn: finalGame?.currentTurn,
                action: finalGame?.currentTurn === 1 ? 'question' : 'answer',
              }),
            });
            if (!notification.ok) console.error('WebSocket turn-changed notification failed:', notification.status);
          } catch (notificationError) {
            console.error('WebSocket turn-changed notification failed:', notificationError);
          }

          return res.status(200).json({
            message: 'Incorrect guess. The game continues.',
            correct: false,
            gameStatus: 'PLAYING',
            currentTurn: finalGame?.currentTurn,
          });
        }
        try {
          const notification = await fetch('http://localhost:3002/internal/game-finished', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode, userId, winnerUserId: player.userId, actualName: opponent.characterName }),
          });
          if (!notification.ok) console.error('WebSocket game-finished notification failed:', notification.status);
        } catch (notificationError) {
          console.error('WebSocket game-finished notification failed:', notificationError);
        }
        return res.status(200).json({
          message: 'Correct guess',
          correct: true,
          gameStatus: 'FINISHED',
          winnerUserId: player.userId,
          actualName: opponent.characterName,
        });
  
      } catch (error) {
        console.error('Guess error:', error);
  
        return res.status(500).json({
          error: 'Failed to submit guess',
        });
      }
    }
  );

roomRouter.get(
    '/:roomCode/result',
    authenticateToken,
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        const player = game.players.find(
          (player) => player.userId === userId
        );
  
        if (!player) {
          return res.status(403).json({
            message: 'You are not a player in this game',
          });
        }
  
        if (game.status !== 'FINISHED') {
          return res.status(400).json({
            message: 'Game has not finished yet',
          });
        }
  
        const winner = game.players.find(
          (player) => player.id === game.winnerPlayerId
        );
        const [questionCount, finalGuess] = await Promise.all([
          prisma.gameMessage.count({ where: { gameId: game.id, type: 'QUESTION' } }),
          prisma.gameMessage.findFirst({ where: { gameId: game.id, type: 'GUESS' }, orderBy: { createdAt: 'desc' }, select: { message: true, senderId: true } }),
        ]);
        const guesser = game.players.find((p) => p.userId === finalGuess?.senderId);
        const actualCharacter = guesser ? game.players.find((p) => p.userId !== guesser.userId) : null;
  
        return res.status(200).json({
          game: {
            id: game.id,
            roomCode: game.roomCode,
            status: game.status,
            startedAt: game.startedAt,
            endedAt: game.endedAt,
          },
          winner: winner
            ? {
                playerId: winner.id,
                username: winner.user.username,
              }
            : null,
          result: game.winnerPlayerId
            ? game.winnerPlayerId === player.id
              ? 'WIN'
              : 'LOSE'
            : 'NO_WINNER',
          // The winner already identified the opponent's character. Keep the
          // loser's opponent character hidden after the game as well.
          actualCharacterName: game.winnerPlayerId === player.id ? actualCharacter?.characterName ?? null : null,
          actualCharacterImageUrl: game.winnerPlayerId === player.id ? actualCharacter?.characterImageUrl ?? null : null,
          winnerPlayerId: game.winnerPlayerId,
          winnerName: winner?.user.username ?? null,
          loserName: game.players.find((p) => p.id !== game.winnerPlayerId)?.user.username ?? null,
          winningGuess: finalGuess?.message ?? null,
          questionCount,
        });
  
      } catch (error) {
        console.error('Get result error:', error);
  
        return res.status(500).json({
          error: 'Failed to get game result',
        });
      }
    }
  );

  roomRouter.get(
    '/:roomCode/messages',
    authenticateToken,
    async (
      req: Request<{ roomCode: string }>,
      res: Response
    ) => {
      try {
        const userId = req.user?.userId;
        const { roomCode } = req.params;
  
        if (!userId) {
          return res.status(401).json({
            message: 'Unauthorized',
          });
        }
  
        const game = await prisma.game.findUnique({
          where: {
            roomCode,
          },
          include: {
            players: true,
          },
        });
  
        if (!game) {
          return res.status(404).json({
            message: 'Room not found',
          });
        }
  
        const isPlayer = game.players.some(
          (player) => player.userId === userId
        );
  
        if (!isPlayer) {
          return res.status(403).json({
            message: 'You are not a player in this game',
          });
        }
  
        const messages = await prisma.gameMessage.findMany({
          where: {
            gameId: game.id,
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        });
  
        return res.status(200).json({
          messages,
        });
  
      } catch (error) {
        console.error('Get messages error:', error);
  
        return res.status(500).json({
          error: 'Failed to get messages',
        });
      }
    }
  );

export default roomRouter;

import { type Request, type Response,Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { prisma } from '@repo/db';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { identifyCharacter } from '../services/gemini.service';

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
  ): Promise<{ secure_url: string }> => {
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

    const roomCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

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
        res.status(500).json({ error: 'Error creating room key' });
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
          await prisma.game.update({
            where: {
              id: game.id,
            },
            data: {
              status: 'FINISHED',
              endedAt: new Date(),
            },
          });
  
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
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
        
        const characterImageUrl = cloudinaryResult.secure_url;

        const aiResult = await identifyCharacter(
          req.file.buffer,
          req.file.mimetype
        );
        
        // AI will be added next.
        const characterName = aiResult.characterName;
        const characterFacts = aiResult.characterFacts;
        const aiConfidence = aiResult.confidence;
  
        const updatedPlayer =
          await prisma.gamePlayer.update({
            where: {
              id: player.id,
            },
            data: {
              characterName,
              characterImageUrl,
              characterFacts,
              aiConfidence,
            },
          });
  
        if (game.status === 'WAITING') {
          await prisma.game.update({
            where: {
              id: game.id,
            },
            data: {
              status: 'UPLOADING',
            },
          });
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

    if(player.position !== 1) {
        return res.status(403).json({ message: 'Only the creator can start the game' });
    }

    if(game.status !== "WAITING" && game.status !== "UPLOADING") {
        return res.status(400).json({ message: 'Game cannot be started in its current state' });
    }

    if(game.players.length !== 2) {
        return res.status(400).json({ message: ' Two players are required to start the game' });
    }

    const allCharactersReady = game.players.every(
        (player) =>
          player.characterName &&
          player.characterImageUrl
      );

      if (!allCharactersReady) {
        return res.status(400).json({ message: 'Both players must select their characters before starting the game' });
      }

    const updateGameStatus = await prisma.game.update({
        where: { 
            roomCode 
        },
        data: { 
            status: "COUNTDOWN",
        },
    });

    return res.status(200).json({ 
        message: 'Game started successfully',
        game: {
            id: game.id,
            roomCode: game.roomCode,
            status: updateGameStatus.status,
        },
    });
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
  
        if (!guess || typeof guess !== 'string') {
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
  
        const isCorrect =
          guess.trim().toLowerCase() ===
          opponent.characterName.trim().toLowerCase();
  
        await prisma.gameMessage.create({
          data: {
            gameId: game.id,
            senderId: userId,
            type: 'GUESS',
            message: guess.trim(),
          },
        });
  
        if (isCorrect) {
          await prisma.game.update({
            where: {
              id: game.id,
            },
            data: {
              status: 'FINISHED',
              winnerPlayerId: player.id,
              endedAt: new Date(),
            },
          });
  
          return res.status(200).json({
            message: 'Correct guess',
            correct: true,
            gameStatus: 'FINISHED',
          });
        }
  
        return res.status(200).json({
          message: 'Incorrect guess',
          correct: false,
          gameStatus: game.status,
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
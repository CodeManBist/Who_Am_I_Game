import { type Request, type Response,Router } from "express";
import { prisma } from "@repo/db";
import { registerSchema, loginSchema } from "@repo/common";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.middleware";

const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET!;

// REGISTER
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { data, error, success } = registerSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        error: error.issues,
      });
    }

    const { username, email, passwordHash } = data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    const hashedPassword = await hash(passwordHash, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
      },
    });

    const token = sign(
      {
        userId: newUser.id,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// LOGIN
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { data, error, success } = loginSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        error: error.issues,
      });
    }

    const { email, passwordHash } = data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await compare(
      passwordHash,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

authRouter.get("/me", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if(!userId) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        passwordHash: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "User found",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default authRouter;
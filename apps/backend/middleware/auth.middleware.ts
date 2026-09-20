import type{ Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  try {
    const decoded = verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !("userId" in decoded)) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    req.user = {
      userId: decoded.userId as string,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
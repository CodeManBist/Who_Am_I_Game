import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

export const authenticateSocket = (token: string): string => {
  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verify(token, JWT_SECRET);

    if (
      typeof decoded === "string" ||
      !("userId" in decoded)
    ) {
      throw new Error("Invalid token");
    }

    return decoded.userId as string;
  } catch {
    throw new Error("Invalid token");
  }
};
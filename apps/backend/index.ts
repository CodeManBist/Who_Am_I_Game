import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes";
import roomRouter from "./routes/room.routes";

const app = express();
const allowedOrigins = new Set(
  ["http://localhost:3000", process.env.FRONTEND_ORIGIN]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.replace(/\/$/, ""))
);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rooms", roomRouter);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

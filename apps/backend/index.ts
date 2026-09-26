import express from "express";

import authRouter from "./routes/auth.routes";
import roomRouter from "./routes/room.routes";

const app = express();

app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rooms", roomRouter);


app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
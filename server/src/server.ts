
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT || 5001);

async function start() {
  const mongoUri = process.env.MONGO_URI;
  const jwtSecret = process.env.JWT_SECRET;

  if (!mongoUri || !jwtSecret) {
    throw new Error("MONGO_URI and JWT_SECRET must be configured.");
  }

  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters.");
  }

  await mongoose.connect(mongoUri, {
    dbName: "csda_calculator",
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`CSDA API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});

import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT || 5001);
async function start() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error("MONGO_URI and JWT_SECRET must be configured.");
  if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  await mongoose.connect(process.env.MONGO_URI, { dbName: "csda_calculator" });
  app.listen(port, () => console.log(`CSDA API listening on port ${port}`));
}
start().catch(err => { console.error("Server startup failed:", err); process.exit(1); });

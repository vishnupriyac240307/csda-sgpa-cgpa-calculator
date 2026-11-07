import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  rollNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  username: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

export default mongoose.model("User", userSchema);

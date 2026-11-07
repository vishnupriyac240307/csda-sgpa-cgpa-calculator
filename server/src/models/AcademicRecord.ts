import mongoose, { Schema } from "mongoose";

const semesterSchema = new Schema({
  semester: { type: Number, required: true, min: 1, max: 6 },
  marks: { type: Map, of: Number, default: {} }
}, { _id: false });

const academicRecordSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  curriculumVersion: { type: String, required: true },
  semesters: { type: [semesterSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("AcademicRecord", academicRecordSchema);

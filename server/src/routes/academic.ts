import { Router } from "express";
import { z } from "zod";
import AcademicRecord from "../models/AcademicRecord.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CURRICULUM, CURRICULUM_VERSION } from "../data/curriculum.js";
import { validateMarks } from "../services/calculation.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(async (req: AuthRequest, res) => {
  const record = await AcademicRecord.findOne({ user: req.userId });
  res.json({ record: record || { semesters: [], curriculumVersion: CURRICULUM_VERSION } });
}));
router.get("/semesters/:semester", asyncHandler(async (req: AuthRequest, res) => {
  const semester = Number(req.params.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 6) return res.status(400).json({ message: "Invalid semester." });
  const record = await AcademicRecord.findOne({ user: req.userId });
  const item = record?.semesters.find(s => s.semester === semester);
  res.json({ semester, marks: item ? Object.fromEntries(item.marks) : {} });
}));
router.put("/semesters/:semester", asyncHandler(async (req: AuthRequest, res) => {
  const semester = Number(req.params.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 6) return res.status(400).json({ message: "Invalid semester." });
  const semesterSubjects = CURRICULUM.filter(s => s.semester === semester);
  if (!semesterSubjects.length) return res.status(409).json({ message: "The official curriculum has not been configured for this semester yet." });
  const parsed = z.record(z.string(), z.number().finite().nonnegative()).safeParse(req.body.marks);
  if (!parsed.success) return res.status(400).json({ message: "Marks must be valid non-negative numbers." });
  const clean: Record<string, number> = {};
  for (const [id, mark] of Object.entries(parsed.data)) {
    const subject = semesterSubjects.find(s => s.id === id);
    if (!subject) return res.status(400).json({ message: "Unknown subject in this semester." });
    const error = validateMarks(mark, subject);
    if (error) return res.status(400).json({ message: `${subject.name}: ${error}` });
    clean[id] = mark;
  }
  let record = await AcademicRecord.findOne({ user: req.userId });
  if (!record) record = new AcademicRecord({ user: req.userId, curriculumVersion: CURRICULUM_VERSION, semesters: [] });
  const existing = record.semesters.find(s => s.semester === semester);
  if (existing) existing.marks = new Map(Object.entries(clean));
  else record.semesters.push({ semester, marks: new Map(Object.entries(clean)) } as any);
  record.curriculumVersion = CURRICULUM_VERSION;
  await record.save();
  res.json({ message: "Saved successfully.", marks: clean });
}));
router.delete("/semesters/:semester", asyncHandler(async (req: AuthRequest, res) => {
  const semester = Number(req.params.semester);
  const record = await AcademicRecord.findOne({ user: req.userId });
if (record) {
  const remainingSemesters = record.semesters.filter(
    (s) => s.semester !== semester
  );

  record.semesters.splice(
    0,
    record.semesters.length,
    ...remainingSemesters
  );

  await record.save();
}  res.json({ message: "Semester marks reset." });
}));
router.delete("/", asyncHandler(async (req: AuthRequest, res) => {
  await AcademicRecord.findOneAndDelete({ user: req.userId });
  res.json({ message: "All academic marks reset." });
}));
export default router;

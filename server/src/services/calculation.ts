import { Subject } from "../data/curriculum.js";

export type MarkEntry = { subjectId: string; marks: number | null };
export function validateMarks(mark: unknown, subject: Subject): string | null {
  if (mark === null || mark === undefined || mark === "") return null;
  if (typeof mark !== "number" || !Number.isFinite(mark)) return "Please enter a valid number.";
  if (mark < 0) return "Marks cannot be negative.";
  if (mark > subject.maxMarks) return "Marks cannot exceed the maximum marks for this subject.";
  if (!subject.allowDecimalMarks && !Number.isInteger(mark)) return "Decimal marks are not allowed for this subject.";
  return null;
}
export function calculateGradePoint(mark: number, maxMark: number) {
  return maxMark > 0 ? (mark / maxMark) * 10 : 0;
}
export function calculateWeightedPoint(mark: number, maxMark: number, credits: number) {
  return calculateGradePoint(mark, maxMark) * credits;
}
export function calculateSemester(subjects: Subject[], marks: Record<string, number>) {
  const eligible = subjects.filter(s => s.includedInSGPA);
  const missing = eligible.filter(s => s.required && marks[s.id] === undefined);
  const valid = eligible.filter(s => marks[s.id] !== undefined);
  const credits = valid.reduce((sum, s) => sum + s.credits, 0);
  const weighted = valid.reduce((sum, s) => sum + calculateWeightedPoint(marks[s.id], s.maxMarks, s.credits), 0);
  return {
    sgpa: credits ? weighted / credits : null,
    credits, weightedPoints: weighted,
    complete: missing.length === 0 && eligible.length > 0,
    missingSubjects: missing.map(s => s.name)
  };
}
export function calculateCumulative(curriculum: Subject[], semesterMarks: Record<number, Record<string, number>>) {
  const eligible = curriculum.filter(s => s.includedInCGPA);
  let credits = 0, weightedPoints = 0;
  const missing: string[] = [];
  for (const s of eligible) {
    const mark = semesterMarks[s.semester]?.[s.id];
    if (mark === undefined) { if (s.required) missing.push(s.name); continue; }
    credits += s.credits;
    weightedPoints += calculateWeightedPoint(mark, s.maxMarks, s.credits);
  }
  return { cgpa: credits ? weightedPoints / credits : null, credits, weightedPoints, complete: missing.length === 0 && eligible.length > 0, missingSubjects: missing };
}

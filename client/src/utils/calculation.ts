
import type { Subject } from "../data/curriculum";

// Check whether a subject is eligible for SGPA and CGPA.
function isEligibleSubject(subject: Subject): boolean {
  const category = subject.category.trim().toLowerCase();
  const name = subject.name.trim().toLowerCase();

  // Include Core, Allied and Skill-Based subjects.
  if (
    category === "core" ||
    category === "allied" ||
    category === "skill course"
  ) {
    return true;
  }

  // Include Core practical laboratory subjects.
  if (
    category === "practical" &&
    name.startsWith("core lab")
  ) {
    return true;
  }

  // Include explicitly identified Core project subjects.
  if (
    category === "project" &&
    name.startsWith("core ")
  ) {
    return true;
  }

  return false;
}

// Calculate grade point based on marks.
export function calculateGradePoint(
  mark: number,
  maxMark: number
): number {
  return maxMark > 0
    ? (mark / maxMark) * 10
    : 0;
}

// Calculate credit-weighted grade points.
export function calculateWeightedPoint(
  mark: number,
  maxMark: number,
  credits: number
): number {
  return calculateGradePoint(mark, maxMark) * credits;
}

// Validate entered marks.
export function validateMarks(
  mark: number | null | undefined,
  subject: Subject
): string | null {
  if (mark === null || mark === undefined) {
    return null;
  }

  if (!Number.isFinite(mark)) {
    return "Please enter a valid number.";
  }

  if (mark < 0) {
    return "Marks cannot be negative.";
  }

  if (mark > subject.maxMarks) {
    return "Marks cannot exceed the maximum marks for this subject.";
  }

  if (
    !subject.allowDecimalMarks &&
    !Number.isInteger(mark)
  ) {
    return "Decimal marks are not allowed.";
  }

  return null;
}

// Calculate SGPA for an individual semester.
export function calculateSGPA(
  subjects: Subject[],
  marks: Record<string, number>
) {
  const eligible = subjects.filter(
    (subject) =>
      subject.includedInSGPA &&
      isEligibleSubject(subject)
  );

  const missing = eligible.filter(
    (subject) =>
      subject.required &&
      marks[subject.id] === undefined
  );

  const valid = eligible.filter(
    (subject) =>
      marks[subject.id] !== undefined
  );

  const credits = valid.reduce(
    (total, subject) =>
      total + subject.credits,
    0
  );

  const weightedPoints = valid.reduce(
    (total, subject) =>
      total +
      calculateWeightedPoint(
        marks[subject.id],
        subject.maxMarks,
        subject.credits
      ),
    0
  );

  return {
    sgpa:
      credits > 0
        ? weightedPoints / credits
        : null,

    credits,
    weightedPoints,

    complete:
      eligible.length > 0 &&
      missing.length === 0,

    missingSubjects: missing.map(
      (subject) => subject.name
    ),
  };
}

// Calculate overall CGPA across all semesters.
export function calculateCGPA(
  subjects: Subject[],
  marksBySemester: Record<
    number,
    Record<string, number>
  >
) {
  const eligible = subjects.filter(
    (subject) =>
      subject.includedInCGPA &&
      isEligibleSubject(subject)
  );

  const missing = eligible.filter(
    (subject) =>
      subject.required &&
      marksBySemester[subject.semester]?.[subject.id] ===
        undefined
  );

  let credits = 0;
  let weightedPoints = 0;

  eligible.forEach((subject) => {
    const mark =
      marksBySemester[subject.semester]?.[subject.id];

    if (mark !== undefined) {
      credits += subject.credits;

      weightedPoints += calculateWeightedPoint(
        mark,
        subject.maxMarks,
        subject.credits
      );
    }
  });

  return {
    cgpa:
      credits > 0
        ? weightedPoints / credits
        : null,

    credits,
    weightedPoints,

    complete:
      eligible.length > 0 &&
      missing.length === 0,

    missingSubjects: missing.map(
      (subject) => subject.name
    ),
  };
}

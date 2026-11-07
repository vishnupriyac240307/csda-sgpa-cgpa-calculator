import { describe, it, expect } from "vitest";
import { calculateGradePoint, calculateWeightedPoint, calculateSGPA, calculateCGPA, validateMarks } from "./calculation";
import type { Subject } from "../data/curriculum";
const subject = (id: string, semester: number, credits: number, maxMarks = 100, included = true): Subject =>
  ({ id, semester, name: id, category: "test", maxMarks, credits, includedInSGPA: included, includedInCGPA: included, allowDecimalMarks: true, required: true });
describe("calculation engine", () => {
  it("calculates grade point and weighted point", () => {
    expect(calculateGradePoint(80, 100)).toBe(8);
    expect(calculateWeightedPoint(80, 100, 4)).toBe(32);
    expect(calculateGradePoint(40, 50)).toBe(8);
  });
  it("calculates weighted SGPA and leaves incomplete semester incomplete", () => {
    const s = [subject("a", 1, 4), subject("b", 1, 2)];
    expect(calculateSGPA(s, { a: 80, b: 60 }).sgpa).toBeCloseTo(7.333333);
    expect(calculateSGPA(s, { a: 80 }).complete).toBe(false);
  });
  it("uses credit-weighted CGPA, not average semester SGPA", () => {
    const s = [subject("a", 1, 4), subject("b", 2, 2)];
    expect(calculateCGPA(s, { 1: { a: 80 }, 2: { b: 60 } }).cgpa).toBeCloseTo(7.333333);
  });
  it("handles zero, negatives, over-maximum and excluded subjects", () => {
    const s = subject("a", 1, 3);
    expect(calculateSGPA([s], { a: 0 }).sgpa).toBe(0);
    expect(validateMarks(-1, s)).toContain("negative");
    expect(validateMarks(101, s)).toContain("maximum");
    expect(calculateSGPA([s, subject("x", 1, 5, 100, false)], { a: 50 }).sgpa).toBe(5);
  });
});

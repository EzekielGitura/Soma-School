import { describe, expect, it } from "vitest";

import { buildClassPerformance, gradeForScore, rankByScore, roundScore } from "./results.js";

const gradeBands = [
  { label: "A", minScore: 80, maxScore: 100, points: 12, remark: "Excellent" },
  { label: "B", minScore: 65, maxScore: 79.99, points: 9, remark: "Very good" },
  { label: "C", minScore: 50, maxScore: 64.99, points: 6, remark: "Satisfactory" },
];

describe("results processing", () => {
  it("rounds scores to two decimal places", () => {
    expect(roundScore(81.335)).toBe(81.34);
  });

  it("returns the matching grade boundary", () => {
    expect(gradeForScore(72, gradeBands)).toMatchObject({
      label: "B",
      remark: "Very good",
    });
  });

  it("shares positions for tied scores", () => {
    const ranked = rankByScore(
      [
        { name: "Alice", score: 88 },
        { name: "Brian", score: 74 },
        { name: "Carol", score: 88 },
      ],
      (item) => item.score,
    );

    expect(ranked.map((row) => [row.name, row.position])).toEqual([
      ["Alice", 1],
      ["Carol", 1],
      ["Brian", 3],
    ]);
  });

  it("calculates class ranking and subject positions", () => {
    const results = buildClassPerformance(
      [
        { id: "s1", admissionNo: "IA-001", firstName: "Alice", lastName: "Njeri" },
        { id: "s2", admissionNo: "IA-002", firstName: "Brian", lastName: "Omondi" },
      ],
      [
        {
          id: "score-1",
          studentId: "s1",
          subjectId: "math",
          subjectCode: "MAT",
          subjectName: "Mathematics",
          catScore: 25,
          examScore: 60,
          totalScore: 85,
        },
        {
          id: "score-2",
          studentId: "s2",
          subjectId: "math",
          subjectCode: "MAT",
          subjectName: "Mathematics",
          catScore: 20,
          examScore: 50,
          totalScore: 70,
        },
      ],
      gradeBands,
    );

    expect(results[0]).toMatchObject({
      admissionNo: "IA-001",
      averageScore: 85,
      grade: "A",
      overallPosition: 1,
    });
    expect(results[0].scores[0].subjectPosition).toBe(1);
    expect(results[1].scores[0].subjectPosition).toBe(2);
  });
});

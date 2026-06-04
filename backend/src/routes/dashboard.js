import { Router } from "express";

import { query } from "../db/pool.js";
import { asyncHandler } from "../utils/http.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const [counts, streams, recentScores] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM class_streams) AS "classStreams",
          (SELECT COUNT(*)::int FROM students) AS students,
          (SELECT COUNT(*)::int FROM subjects) AS subjects,
          (SELECT COUNT(*)::int FROM assessment_scores) AS scores
      `),
      query(`
        SELECT
          cs.id,
          cs.name,
          cs.teacher_name AS "teacherName",
          cs.academic_year AS "academicYear",
          cs.capacity,
          COUNT(DISTINCT st.id)::int AS "studentCount",
          COUNT(DISTINCT ss.subject_id)::int AS "subjectCount"
        FROM class_streams cs
        LEFT JOIN students st ON st.class_stream_id = cs.id
        LEFT JOIN stream_subjects ss ON ss.class_stream_id = cs.id
        GROUP BY cs.id
        ORDER BY cs.academic_year DESC, cs.name ASC
      `),
      query(`
        SELECT
          a.id,
          a.term,
          a.academic_year AS "academicYear",
          a.total_score AS "totalScore",
          st.first_name AS "firstName",
          st.last_name AS "lastName",
          sub.name AS "subjectName"
        FROM assessment_scores a
        JOIN students st ON st.id = a.student_id
        JOIN subjects sub ON sub.id = a.subject_id
        ORDER BY a.updated_at DESC
        LIMIT 6
      `),
    ]);

    res.json({
      counts: counts.rows[0],
      streams: streams.rows,
      recentScores: recentScores.rows.map((score) => ({
        ...score,
        totalScore: Number(score.totalScore),
      })),
    });
  }),
);

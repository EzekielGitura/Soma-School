import { Router } from "express";

import { query } from "../db/pool.js";
import { getClassSubjectPerformance } from "../services/data.js";
import { scoreSchema } from "../validation/schemas.js";
import { asyncHandler, badRequest, notFound, sendCreated } from "../utils/http.js";

export const scoresRouter = Router();

scoresRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(`
      SELECT
        a.id,
        a.student_id AS "studentId",
        a.subject_id AS "subjectId",
        a.term,
        a.academic_year AS "academicYear",
        a.cat_score AS "catScore",
        a.exam_score AS "examScore",
        a.total_score AS "totalScore",
        a.remarks,
        st.admission_no AS "admissionNo",
        st.first_name AS "firstName",
        st.last_name AS "lastName",
        cs.name AS "classStreamName",
        sub.code AS "subjectCode",
        sub.name AS "subjectName"
      FROM assessment_scores a
      JOIN students st ON st.id = a.student_id
      JOIN class_streams cs ON cs.id = st.class_stream_id
      JOIN subjects sub ON sub.id = a.subject_id
      ORDER BY a.updated_at DESC
      LIMIT 50
    `);

    res.json(rows.map(numberScore));
  }),
);

scoresRouter.get(
  "/class-subject",
  asyncHandler(async (req, res) => {
    if (!req.query.streamId || !req.query.subjectId || !req.query.term || !req.query.academicYear) {
      throw badRequest("streamId, subjectId, term, and academicYear are required.");
    }

    const rows = await getClassSubjectPerformance({
      classStreamId: req.query.streamId,
      subjectId: req.query.subjectId,
      term: req.query.term,
      academicYear: Number(req.query.academicYear),
    });

    res.json(rows);
  }),
);

scoresRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = scoreSchema.parse(req.body);
    await ensureSubjectBelongsToStudentStream(data.studentId, data.subjectId);

    const duplicate = await query(
      `
        SELECT id
        FROM assessment_scores
        WHERE student_id = $1
          AND subject_id = $2
          AND term = $3
          AND academic_year = $4
      `,
      [data.studentId, data.subjectId, data.term, data.academicYear],
    );

    if (duplicate.rows[0]) {
      throw badRequest("A score already exists for that student, subject, term, and year.");
    }

    const { rows } = await query(
      `
        INSERT INTO assessment_scores (
          student_id,
          subject_id,
          term,
          academic_year,
          cat_score,
          exam_score,
          remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          student_id AS "studentId",
          subject_id AS "subjectId",
          term,
          academic_year AS "academicYear",
          cat_score AS "catScore",
          exam_score AS "examScore",
          total_score AS "totalScore",
          remarks
      `,
      [
        data.studentId,
        data.subjectId,
        data.term,
        data.academicYear,
        data.catScore,
        data.examScore,
        data.remarks,
      ],
    );

    sendCreated(res, numberScore(rows[0]));
  }),
);

scoresRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = scoreSchema.parse(req.body);
    await ensureSubjectBelongsToStudentStream(data.studentId, data.subjectId);

    const { rows } = await query(
      `
        UPDATE assessment_scores
        SET
          student_id = $1,
          subject_id = $2,
          term = $3,
          academic_year = $4,
          cat_score = $5,
          exam_score = $6,
          remarks = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING
          id,
          student_id AS "studentId",
          subject_id AS "subjectId",
          term,
          academic_year AS "academicYear",
          cat_score AS "catScore",
          exam_score AS "examScore",
          total_score AS "totalScore",
          remarks
      `,
      [
        data.studentId,
        data.subjectId,
        data.term,
        data.academicYear,
        data.catScore,
        data.examScore,
        data.remarks,
        req.params.id,
      ],
    );

    if (!rows[0]) throw notFound("Score not found.");
    res.json(numberScore(rows[0]));
  }),
);

scoresRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM assessment_scores WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) throw notFound("Score not found.");
    res.status(204).send();
  }),
);

async function ensureSubjectBelongsToStudentStream(studentId, subjectId) {
  const { rows } = await query(
    `
      SELECT ss.id
      FROM students st
      JOIN stream_subjects ss ON ss.class_stream_id = st.class_stream_id
      WHERE st.id = $1 AND ss.subject_id = $2
    `,
    [studentId, subjectId],
  );

  if (!rows[0]) {
    throw badRequest("That subject is not assigned to the student's class stream.");
  }
}

function numberScore(score) {
  return {
    ...score,
    catScore: Number(score.catScore),
    examScore: Number(score.examScore),
    totalScore: Number(score.totalScore),
  };
}

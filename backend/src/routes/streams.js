import { Router } from "express";

import { query } from "../db/pool.js";
import { getClassPerformance } from "../services/data.js";
import { classStreamSchema } from "../validation/schemas.js";
import { asyncHandler, badRequest, notFound, sendCreated } from "../utils/http.js";

export const streamsRouter = Router();

streamsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(`
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
    `);

    res.json(rows);
  }),
);

streamsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = classStreamSchema.parse(req.body);
    const { rows } = await query(
      `
        INSERT INTO class_streams (name, teacher_name, academic_year, capacity)
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          teacher_name AS "teacherName",
          academic_year AS "academicYear",
          capacity
      `,
      [data.name, data.teacherName, data.academicYear, data.capacity],
    );

    sendCreated(res, rows[0]);
  }),
);

streamsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = await getClassPerformance(req.params.id, {
      term: req.query.term,
      academicYear: req.query.academicYear,
    });

    if (!data) throw notFound("Class stream not found.");

    const [students, subjects] = await Promise.all([
      query(
        `
          SELECT
            id,
            admission_no AS "admissionNo",
            first_name AS "firstName",
            last_name AS "lastName",
            gender,
            guardian_name AS "guardianName",
            guardian_phone AS "guardianPhone"
          FROM students
          WHERE class_stream_id = $1
          ORDER BY last_name ASC, first_name ASC
        `,
        [req.params.id],
      ),
      query(
        `
          SELECT
            sub.id,
            sub.code,
            sub.name,
            sub.teacher_name AS "teacherName"
          FROM stream_subjects ss
          JOIN subjects sub ON sub.id = ss.subject_id
          WHERE ss.class_stream_id = $1
          ORDER BY sub.name ASC
        `,
        [req.params.id],
      ),
    ]);

    res.json({
      ...data,
      students: students.rows,
      subjects: subjects.rows,
    });
  }),
);

streamsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = classStreamSchema.parse(req.body);
    const { rows } = await query(
      `
        UPDATE class_streams
        SET
          name = $1,
          teacher_name = $2,
          academic_year = $3,
          capacity = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          name,
          teacher_name AS "teacherName",
          academic_year AS "academicYear",
          capacity
      `,
      [data.name, data.teacherName, data.academicYear, data.capacity, req.params.id],
    );

    if (!rows[0]) throw notFound("Class stream not found.");
    res.json(rows[0]);
  }),
);

streamsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const students = await query(
      "SELECT COUNT(*)::int AS count FROM students WHERE class_stream_id = $1",
      [req.params.id],
    );

    if (students.rows[0].count > 0) {
      throw badRequest("Move or delete students before deleting this class stream.");
    }

    const { rowCount } = await query("DELETE FROM class_streams WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) throw notFound("Class stream not found.");
    res.status(204).send();
  }),
);

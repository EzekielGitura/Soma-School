import { Router } from "express";

import { query } from "../db/pool.js";
import { getStudentPerformance } from "../services/data.js";
import { studentSchema } from "../validation/schemas.js";
import { asyncHandler, notFound, sendCreated } from "../utils/http.js";

export const studentsRouter = Router();

studentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const params = [];
    let where = "";

    if (req.query.streamId) {
      params.push(req.query.streamId);
      where = "WHERE s.class_stream_id = $1";
    }

    const { rows } = await query(
      `
        SELECT
          s.id,
          s.admission_no AS "admissionNo",
          s.first_name AS "firstName",
          s.last_name AS "lastName",
          s.gender,
          s.date_of_birth AS "dateOfBirth",
          s.guardian_name AS "guardianName",
          s.guardian_phone AS "guardianPhone",
          s.class_stream_id AS "classStreamId",
          cs.name AS "classStreamName"
        FROM students s
        JOIN class_streams cs ON cs.id = s.class_stream_id
        ${where}
        ORDER BY cs.name ASC, s.last_name ASC, s.first_name ASC
      `,
      params,
    );

    res.json(rows);
  }),
);

studentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = studentSchema.parse(req.body);
    const { rows } = await query(
      `
        INSERT INTO students (
          admission_no,
          first_name,
          last_name,
          gender,
          date_of_birth,
          guardian_name,
          guardian_phone,
          class_stream_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          admission_no AS "admissionNo",
          first_name AS "firstName",
          last_name AS "lastName",
          class_stream_id AS "classStreamId"
      `,
      [
        data.admissionNo,
        data.firstName,
        data.lastName,
        data.gender,
        data.dateOfBirth,
        data.guardianName,
        data.guardianPhone,
        data.classStreamId,
      ],
    );

    sendCreated(res, rows[0]);
  }),
);

studentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = await getStudentPerformance(req.params.id, {
      term: req.query.term,
      academicYear: req.query.academicYear,
    });

    if (!data) throw notFound("Student not found.");
    res.json(data);
  }),
);

studentsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = studentSchema.parse(req.body);
    const { rows } = await query(
      `
        UPDATE students
        SET
          admission_no = $1,
          first_name = $2,
          last_name = $3,
          gender = $4,
          date_of_birth = $5,
          guardian_name = $6,
          guardian_phone = $7,
          class_stream_id = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING
          id,
          admission_no AS "admissionNo",
          first_name AS "firstName",
          last_name AS "lastName",
          class_stream_id AS "classStreamId"
      `,
      [
        data.admissionNo,
        data.firstName,
        data.lastName,
        data.gender,
        data.dateOfBirth,
        data.guardianName,
        data.guardianPhone,
        data.classStreamId,
        req.params.id,
      ],
    );

    if (!rows[0]) throw notFound("Student not found.");
    res.json(rows[0]);
  }),
);

studentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM students WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) throw notFound("Student not found.");
    res.status(204).send();
  }),
);

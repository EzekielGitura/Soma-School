import { Router } from "express";

import { pool, query } from "../db/pool.js";
import { subjectSchema } from "../validation/schemas.js";
import { asyncHandler, notFound, sendCreated } from "../utils/http.js";

export const subjectsRouter = Router();

subjectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(`
      SELECT
        sub.id,
        sub.code,
        sub.name,
        sub.teacher_name AS "teacherName",
        COUNT(DISTINCT a.id)::int AS "scoreCount",
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', cs.id,
              'name', cs.name
            )
          ) FILTER (WHERE cs.id IS NOT NULL),
          '[]'
        ) AS streams
      FROM subjects sub
      LEFT JOIN stream_subjects ss ON ss.subject_id = sub.id
      LEFT JOIN class_streams cs ON cs.id = ss.class_stream_id
      LEFT JOIN assessment_scores a ON a.subject_id = sub.id
      GROUP BY sub.id
      ORDER BY sub.name ASC
    `);

    res.json(rows);
  }),
);

subjectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.parse(req.body);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `
          INSERT INTO subjects (code, name, teacher_name)
          VALUES ($1, $2, $3)
          RETURNING id, code, name, teacher_name AS "teacherName"
        `,
        [data.code, data.name, data.teacherName],
      );

      for (const streamId of data.streamIds) {
        await client.query(
          `
            INSERT INTO stream_subjects (class_stream_id, subject_id)
            VALUES ($1, $2)
            ON CONFLICT (class_stream_id, subject_id) DO NOTHING
          `,
          [streamId, rows[0].id],
        );
      }

      await client.query("COMMIT");
      sendCreated(res, { ...rows[0], streams: data.streamIds });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }),
);

subjectsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.parse(req.body);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `
          UPDATE subjects
          SET
            code = $1,
            name = $2,
            teacher_name = $3,
            updated_at = NOW()
          WHERE id = $4
          RETURNING id, code, name, teacher_name AS "teacherName"
        `,
        [data.code, data.name, data.teacherName, req.params.id],
      );

      if (!rows[0]) throw notFound("Subject not found.");

      await client.query("DELETE FROM stream_subjects WHERE subject_id = $1", [
        req.params.id,
      ]);

      for (const streamId of data.streamIds) {
        await client.query(
          `
            INSERT INTO stream_subjects (class_stream_id, subject_id)
            VALUES ($1, $2)
            ON CONFLICT (class_stream_id, subject_id) DO NOTHING
          `,
          [streamId, req.params.id],
        );
      }

      await client.query("COMMIT");
      res.json({ ...rows[0], streams: data.streamIds });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }),
);

subjectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM subjects WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) throw notFound("Subject not found.");
    res.status(204).send();
  }),
);

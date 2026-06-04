import { Router } from "express";

import { query } from "../db/pool.js";
import { gradeBoundarySchema } from "../validation/schemas.js";
import { asyncHandler, notFound, sendCreated } from "../utils/http.js";

export const gradingRouter = Router();

gradingRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await query(`
      SELECT
        id,
        label,
        min_score AS "minScore",
        max_score AS "maxScore",
        points,
        remark,
        sort_order AS "sortOrder"
      FROM grade_boundaries
      ORDER BY sort_order ASC
    `);

    res.json(rows.map(numberGrade));
  }),
);

gradingRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = gradeBoundarySchema.parse(req.body);
    const { rows } = await query(
      `
        INSERT INTO grade_boundaries (label, min_score, max_score, points, remark, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          label,
          min_score AS "minScore",
          max_score AS "maxScore",
          points,
          remark,
          sort_order AS "sortOrder"
      `,
      [data.label, data.minScore, data.maxScore, data.points, data.remark, data.sortOrder],
    );

    sendCreated(res, numberGrade(rows[0]));
  }),
);

gradingRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = gradeBoundarySchema.parse(req.body);
    const { rows } = await query(
      `
        UPDATE grade_boundaries
        SET
          label = $1,
          min_score = $2,
          max_score = $3,
          points = $4,
          remark = $5,
          sort_order = $6
        WHERE id = $7
        RETURNING
          id,
          label,
          min_score AS "minScore",
          max_score AS "maxScore",
          points,
          remark,
          sort_order AS "sortOrder"
      `,
      [
        data.label,
        data.minScore,
        data.maxScore,
        data.points,
        data.remark,
        data.sortOrder,
        req.params.id,
      ],
    );

    if (!rows[0]) throw notFound("Grade boundary not found.");
    res.json(numberGrade(rows[0]));
  }),
);

gradingRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rowCount } = await query("DELETE FROM grade_boundaries WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) throw notFound("Grade boundary not found.");
    res.status(204).send();
  }),
);

function numberGrade(grade) {
  return {
    ...grade,
    minScore: Number(grade.minScore),
    maxScore: Number(grade.maxScore),
  };
}

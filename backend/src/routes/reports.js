import { Router } from "express";

import { getClassPerformance, getStudentPerformance } from "../services/data.js";
import { sendClassReportPdf, sendStudentReportPdf } from "../services/pdf.js";
import { asyncHandler, badRequest, notFound } from "../utils/http.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/class",
  asyncHandler(async (req, res) => {
    const { streamId, term = "Term 1", academicYear = 2026 } = req.query;
    if (!streamId) throw badRequest("streamId is required.");

    const data = await getClassPerformance(streamId, {
      term,
      academicYear: Number(academicYear),
    });
    if (!data) throw notFound("Class stream not found.");

    res.json({
      stream: data.stream,
      term,
      academicYear: Number(academicYear),
      performance: data.performance,
    });
  }),
);

reportsRouter.get(
  "/class/pdf",
  asyncHandler(async (req, res) => {
    const { streamId, term = "Term 1", academicYear = 2026 } = req.query;
    if (!streamId) throw badRequest("streamId is required.");

    const data = await getClassPerformance(streamId, {
      term,
      academicYear: Number(academicYear),
    });
    if (!data) throw notFound("Class stream not found.");

    sendClassReportPdf(res, {
      stream: data.stream,
      term,
      academicYear: Number(academicYear),
      performance: data.performance,
    });
  }),
);

reportsRouter.get(
  "/students/:id/pdf",
  asyncHandler(async (req, res) => {
    const { term = "Term 1", academicYear = 2026 } = req.query;
    const data = await getStudentPerformance(req.params.id, {
      term,
      academicYear: Number(academicYear),
    });
    if (!data) throw notFound("Student not found.");

    sendStudentReportPdf(res, {
      student: data.student,
      stream: data.stream,
      term,
      academicYear: Number(academicYear),
      performance: data.performance,
    });
  }),
);

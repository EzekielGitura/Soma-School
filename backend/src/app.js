import cors from "cors";
import express from "express";
import { ZodError } from "zod";

import { dashboardRouter } from "./routes/dashboard.js";
import { gradingRouter } from "./routes/grading.js";
import { reportsRouter } from "./routes/reports.js";
import { scoresRouter } from "./routes/scores.js";
import { streamsRouter } from "./routes/streams.js";
import { studentsRouter } from "./routes/students.js";
import { subjectsRouter } from "./routes/subjects.js";
import { query } from "./db/pool.js";
import { handleError } from "./utils/http.js";

export const app = express();

const localClientOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function allowedClientOrigins() {
  return new Set([
    ...localClientOrigins,
    ...(process.env.CLIENT_ORIGIN || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins().has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "soma-school-api" });
});

app.get("/api/health/db", async (req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/streams", streamsRouter);
app.use("/api/students", studentsRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/scores", scoresRouter);
app.use("/api/grading", gradingRouter);
app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: error.issues[0]?.message || "Invalid request data.",
      issues: error.issues,
    });
    return;
  }

  handleError(error, req, res, next);
});

export default app;

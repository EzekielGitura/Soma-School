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
import { handleError } from "./utils/http.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((value) => value.trim());

      if (!origin || allowedOrigins.includes(origin)) {
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
